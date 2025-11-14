FROM rust:1.75-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libwebkit2gtk-4.0-dev \
    build-essential \
    libssl-dev \
    libsoup2.4-dev \
    libjavascriptcoregtk-4.0-dev \
    pkg-config \
    mingw-w64 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and pnpm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# Install Rust targets
RUN rustup target add x86_64-unknown-linux-gnu \
    && rustup target add x86_64-pc-windows-gnu

# Note: macOS cross-compilation from Linux requires osxcross which is complex
# We'll skip it for now - it requires the macOS SDK and additional setup

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of the project
COPY . .

# Build for Linux (native)
RUN pnpm tauri build --target x86_64-unknown-linux-gnu

# Build for Windows
RUN pnpm tauri build --target x86_64-pc-windows-gnu

CMD ["echo", "Build complete. Check src-tauri/target/*/release/bundle/"]