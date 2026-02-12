import { serveFile, serveDir } from "jsr:@std/http@1/file-server";

const clients = new Map<string, WebSocket>();

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // WebSocket endpoint for signaling
  if (url.pathname === "/ws" && req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientId = crypto.randomUUID();

    socket.onopen = () => {
      console.log(`[${new Date().toISOString()}] Client connected: ${clientId}`);
      clients.set(clientId, socket);
    };

    socket.onmessage = (event) => {
      try {
        // Parse and validate message
        const message = JSON.parse(event.data);
        
        // Validate message has required fields
        if (!message.type) {
          console.warn(`[${new Date().toISOString()}] Invalid message: missing type from ${clientId}`);
          return;
        }

        // Validate offer/answer/candidate exist and aren't empty
        if (message.type === 'offer' && !message.offer) {
          console.warn(`[${new Date().toISOString()}] Invalid offer from ${clientId}: missing offer data`);
          return;
        }
        if (message.type === 'answer' && !message.answer) {
          console.warn(`[${new Date().toISOString()}] Invalid answer from ${clientId}: missing answer data`);
          return;
        }
        // ICE candidates don't need validation - just relay them
        // if (message.type === 'ice-candidate' && !message.candidate) {
        //   console.warn(`[${new Date().toISOString()}] Invalid ICE candidate from ${clientId}: missing candidate data`);
        //   return;
        // }

        console.log(`[${new Date().toISOString()}] Relaying ${message.type} from ${clientId.substring(0, 8)}`);

        // Relay WebRTC signals to all other clients
        clients.forEach((client, id) => {
          if (id !== clientId && client.readyState === WebSocket.OPEN) {
            client.send(event.data);
          }
        });
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error parsing message from ${clientId}:`, error);
      }
    };

    socket.onclose = () => {
      clients.delete(clientId);
      console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId}`);
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    };

    return response;
  }

  if (url.pathname === "/favicon.ico") {
    return new Response(null, { status: 204 });
  }
  
  // Serve static files from public/
  try {
    // Let serveDir handle directory index resolution (index.html), content-type, and range requests.
    return await serveDir(req, { fsRoot: "./public", urlRoot: "" });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Static serve error for ${url.pathname}:`, err);
    return new Response("Not Found", { status: 404 });
  }
});
