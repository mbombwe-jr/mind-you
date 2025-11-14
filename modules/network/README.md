# Fubuki Node - Standalone Client

A portable, standalone Fubuki node client that can be used to connect to Fubuki servers from anywhere.

## Features

- **Portable**: Self-contained crate that can be moved to any location
- **Easy to Use**: Simple command-line interface
- **Configurable**: JSON-based configuration
- **Cross-platform**: Works on Windows, Linux, and macOS

## Quick Start

### 1. Build the Node

```bash
cd network
cargo build --release
```

The executable will be at: `target/release/network.exe` (Windows) or `target/release/network` (Linux/macOS)

### 2. Configure

Edit `node-config.json` and set:
- `groups[].server_addr`: The server address to connect to (e.g., `"192.168.1.100:8081"`)
- `groups[].key`: The shared secret key (must match the server's key)

### 3. Run

```bash
# Use default config (node-config.json)
./target/release/network

# Or specify a custom config file
./target/release/network --config /path/to/config.json

# Show example configuration
./target/release/network --example
```

## Configuration

See `node-config.json` for a complete example, or run `network --example` to see the template.

### Key Configuration Fields

- **server_addr**: Server address in format `"IP:PORT"` (e.g., `"192.168.1.100:8081"`)
- **key**: Shared secret key (must match server configuration)
- **tun_addr** (optional): IP address and netmask for this node
- **node_name** (optional): Name identifier for this node

## Portability

To use this node in another location:

1. **Copy the entire `network` directory** to your desired location
2. **Ensure the `network` crate is accessible** (either as a sibling directory or update the path in `Cargo.toml`)
3. **Build**: `cargo build --release`
4. **Configure**: Edit `node-config.json` with your server details
5. **Run**: Execute the binary

### Making it Fully Standalone

If you want to distribute just the binary without the source:

1. Build in release mode: `cargo build --release`
2. Copy the executable and `node-config.json` to your target location
3. Ensure all required DLLs (on Windows) or shared libraries are available

## Example Usage

```bash
# Connect to a server at 192.168.1.100:8081
./network --config my-config.json

# Show help
./network --help

# Show example configuration
./network --example
```

## Troubleshooting

- **"Configuration file not found"**: Create `node-config.json` or specify path with `--config`
- **"Failed to connect"**: Check that the server address and port are correct
- **"Authentication failed"**: Verify that the `key` matches the server's key

## Dependencies

This crate depends on:
- `fubuki` (network crate) - Core networking functionality
- `clap` - Command-line argument parsing
- `anyhow` - Error handling

## License

Same as the parent project.





