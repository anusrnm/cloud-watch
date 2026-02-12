FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Install Node.js (via nvm)
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR="/root/.nvm"
RUN . $NVM_DIR/nvm.sh && nvm install --lts && nvm alias default lts/*
ENV PATH="${NVM_DIR}/versions/node/lts:${PATH}"

# Install Deno
RUN curl -fsSL https://deno.land/x/install/install.sh | sh
ENV PATH="/root/.deno/bin:${PATH}"

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Verify installations
RUN node --version && npm --version && deno --version && bun --version
