# Docker Registry Console

[![Docker Hub](https://img.shields.io/docker/v/rubenmacedobarbosa/registry-console?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/rubenmacedobarbosa/registry-console)
[![Build Status](https://img.shields.io/github/actions/workflow/status/rtmmbarbosa/registry-console/build-package.yml)](https://github.com/rtmmbarbosa/registry-console/actions)
[![License](https://img.shields.io/github/license/rtmmbarbosa/registry-console)](https://github.com/rtmmbarbosa/registry-console/blob/main/LICENSE)

A modern, production-ready web interface for Docker Registry management with support for multi-architecture images, OCI artifacts, and secure authentication.

## ✨ Features

- 🐳 **Multi-Registry Support** - Connect to any Docker Registry (Docker Hub, GHCR, private registries)
- 🏗️ **Multi-Architecture** - Full support for `linux/amd64` and `linux/arm64` images
- 🔒 **Secure Authentication** - Built-in authentication with session management
- 📊 **Modern UI** - Clean, responsive interface with real-time updates
- 🗂️ **Image Management** - Browse, view, and delete images and tags
- 🔍 **Search & Filter** - Quick search across repositories and tags
- 📋 **Image Details** - View manifests, layers, and metadata
- ⚡ **Performance** - Optimized for large registries with thousands of images

## 🚀 Quick Start

### Docker Run
```bash
docker run -d \
  --name registry-console \
  -p 3000:3000 \
  -e REGISTRY_URL=https://registry-1.docker.io \
  -e REGISTRY_NAME="Docker Hub" \
  rubenmacedobarbosa/registry-console:latest
```

### Docker Compose
```yaml
version: '3.8'
services:
  registry-console:
    image: rubenmacedobarbosa/registry-console:latest
    ports:
      - "3000:3000"
    environment:
      - REGISTRY_URL=https://registry-1.docker.io
      - REGISTRY_NAME=Docker Hub
      - REGISTRY_USERNAME=your-username
      - REGISTRY_PASSWORD=your-password
    restart: unless-stopped
```

## 🔧 Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `REGISTRY_URL` | Docker Registry URL | `https://registry-1.docker.io` |
| `REGISTRY_NAME` | Display name for the registry | `Docker Registry` |
| `REGISTRY_USERNAME` | Registry username (optional) | - |
| `REGISTRY_PASSWORD` | Registry password (optional) | - |
| `PORT` | Server port | `3000` |
| `SESSION_SECRET` | Session secret for authentication | Generated |

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Backend**: Node.js with Express.js
- **Authentication**: Session-based with bcrypt
- **Registry API**: Docker Registry HTTP API v2
- **Multi-arch**: Native support for AMD64 and ARM64

## 📱 Screenshots

The application provides a clean, modern interface for registry management:

- **Repository Browser**: Navigate through your Docker repositories
- **Image Details**: View detailed information about images and tags
- **Tag Management**: Delete individual tags or entire repositories
- **Search**: Quick search across all repositories

## 🔒 Security

- Authentication required for registry access
- Session-based security with secure cookies
- CORS protection enabled
- Input validation and sanitization
- Non-root container execution

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/rtmmbarbosa/registry-console.git

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 📋 Requirements

- Docker Registry API v2 compatible
- Node.js 18+ (for development)
- Modern web browser with JavaScript enabled

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/rtmmbarbosa/registry-console/blob/main/LICENSE) file for details.

## 👤 Author

**Ruben Macedo Barbosa**
- GitHub: [@rtmmbarbosa](https://github.com/rtmmbarbosa)
- Email: rubenmacedobarbosa@gmail.com

## 🔗 Links

- [GitHub Repository](https://github.com/rtmmbarbosa/registry-console)
- [Docker Hub](https://hub.docker.com/r/rubenmacedobarbosa/registry-console)
- [Issues](https://github.com/rtmmbarbosa/registry-console/issues)
- [Changelog](https://github.com/rtmmbarbosa/registry-console/releases)
