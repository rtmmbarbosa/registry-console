# Docker Hub Configuration

## Repository Information

### Short Description
Modern web interface for Docker Registry management with multi-architecture support

### Full Description
A production-ready web interface for Docker Registry management featuring authentication, multi-architecture support (AMD64/ARM64), OCI artifacts handling, and modern responsive UI. Perfect for managing private Docker registries, Docker Hub repositories, and container image lifecycle.

### Category
**Development Tools**

### Tags
- `latest` - Latest stable release
- `1.0.0` - Stable version 1.0.0
- `v1.0.0` - Stable version 1.0.0 (alias)

### Supported Architectures
- `linux/amd64` - Intel/AMD 64-bit
- `linux/arm64` - ARM 64-bit (Apple Silicon, ARM servers)

### Repository Settings for Docker Hub

When creating the repository on Docker Hub, use these settings:

**Repository Name:** `registry-console`  
**Namespace:** `rubenmacedobarbosa`  
**Full Name:** `rubenmacedobarbosa/registry-console`  
**Visibility:** Public  
**Category:** Development Tools  

**Short Description:**
```
Modern web interface for Docker Registry management with multi-architecture support
```

**Long Description:**
```
A production-ready web interface for Docker Registry management featuring:

🔹 Multi-Architecture Support (AMD64/ARM64)
🔹 Secure Authentication & Session Management  
🔹 Modern Responsive UI
🔹 Multi-Registry Support (Docker Hub, GHCR, Private)
🔹 OCI Artifacts & Multi-arch Images
🔹 Image & Tag Management
🔹 Real-time Updates & Search
🔹 Production-Ready with Health Checks

Perfect for developers, DevOps teams, and organizations managing container images across different registries.

Source: https://github.com/rtmmbarbosa/registry-console
```

### Keywords/Tags for Docker Hub
```
docker, registry, ui, management, container, web-interface, docker-hub, multi-arch, oci, production, development-tools, image-management, devops, private-registry
```

### Build Settings
- **Source:** GitHub
- **Repository:** rtmmbarbosa/registry-console
- **Build Rules:**
  - **Tag:** `latest` → **Dockerfile:** `Dockerfile` → **Context:** `/`
  - **Tag:** `{sourceref}` → **Dockerfile:** `Dockerfile` → **Context:** `/`

### Auto-Build Configuration
- **Build Context:** `/`
- **Dockerfile:** `Dockerfile`
- **Build Rules:**
  - Push to `main` branch → builds `latest` tag
  - Push tag matching `/^v[0-9.]+$/` → builds `{sourceref}` tag

### Links
- **Homepage:** https://github.com/rtmmbarbosa/registry-console
- **Source Repository:** https://github.com/rtmmbarbosa/registry-console
- **Issues:** https://github.com/rtmmbarbosa/registry-console/issues
- **Documentation:** https://github.com/rtmmbarbosa/registry-console/blob/main/README.md

### Usage Examples
```bash
# Basic usage
docker run -d -p 3000:3000 rubenmacedobarbosa/registry-console

# With registry configuration
docker run -d \
  -p 3000:3000 \
  -e REGISTRY_URL=https://registry-1.docker.io \
  -e REGISTRY_NAME="Docker Hub" \
  rubenmacedobarbosa/registry-console

# With authentication
docker run -d \
  -p 3000:3000 \
  -e REGISTRY_URL=https://your-registry.com \
  -e REGISTRY_USERNAME=your-username \
  -e REGISTRY_PASSWORD=your-password \
  rubenmacedobarbosa/registry-console
```
