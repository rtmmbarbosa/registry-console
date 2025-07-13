# RegistryConsole 🐳

Modern web interface for Docker Registry management with environment-based configuration, perfect for production deployments and containerized environments.

## ✨ Features

- **📦 Repository Management**: View and manage all repositories in the registry
- **🏷️ Tag Management**: Complete listing and management of tags per repository
- **🗑️ Safe Cleanup**: Image deletion with confirmation dialogs
- **📊 Advanced Analytics**: Real-time usage and storage metrics with caching
- **⚙️ Modern Settings**: Environment-based configuration with live updates
- **🎨 Responsive UI**: Dark/Light theme with smooth animations
- **🔧 Auto-refresh**: Configurable automatic data refresh
- **📈 Export Features**: Statistics and settings export capabilities
- **🚀 Container-Ready**: Full Docker and Kubernetes support

## 🚀 Quick Start

### 1. Environment Configuration

```bash
# Clone and enter directory
git clone <repository-url>
cd registry_ui

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env` with your registry details:
```env
# Registry Configuration
REGISTRY_URL=your-registry-url.com
REGISTRY_USERNAME=your_username
REGISTRY_PASSWORD=your_password
PORT=3000
NODE_ENV=production

# Application Settings
DEFAULT_THEME=light
AUTO_REFRESH_INTERVAL=300000
AUTO_REFRESH_ENABLED=true
NOTIFICATIONS_ENABLED=true
CACHE_ENABLED=true
CACHE_TTL=300000
STATISTICS_EXPORT_ENABLED=true
SETTINGS_EXPORT_ENABLED=true
```

### 2. Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Or run in production
npm start
```

### 3. Docker Deployment

```bash
# Basic deployment
docker-compose up -d

# Production deployment
docker-compose --profile production up -d

# Development mode
docker-compose --profile development up -d
```

### 4. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_THEME` | `light` | UI theme: `light`, `dark`, or `auto` |
| `AUTO_REFRESH_INTERVAL` | `300000` | Auto-refresh interval in milliseconds |
| `AUTO_REFRESH_ENABLED` | `true` | Enable/disable automatic refresh |
| `NOTIFICATIONS_ENABLED` | `true` | Enable/disable notifications |
| `CACHE_ENABLED` | `true` | Enable/disable caching |
| `CACHE_TTL` | `300000` | Cache TTL in milliseconds |
| `STATISTICS_EXPORT_ENABLED` | `true` | Enable/disable statistics export |
| `SETTINGS_EXPORT_ENABLED` | `true` | Enable/disable settings export |

```bash
# Build image
docker build -t registry-ui .

# Run with Docker Compose
docker-compose up -d
```

## 📋 Requirements

- **Node.js** 18+ 
- **Docker** (optional, for containerization)
- **Docker Registry** v2 API compatible

## 🛠️ Project Structure

```
registry_ui/
├── public/                 # Frontend assets
│   ├── index.html         # Main interface
│   ├── styles.css         # Modern responsive styles
│   └── script.js          # Frontend logic with settings API
├── server.js              # Express.js server with REST API
├── package.json           # Node.js dependencies
├── Dockerfile             # Production Docker configuration
├── docker-compose.yml     # Multi-environment orchestration
├── .env.example          # Environment configuration template
└── CONFIG.md             # Detailed configuration guide
```

## 🔧 API Endpoints

### Registry Management
- `GET /api/repositories` - List all repositories
- `GET /api/repositories/:name/tags` - List repository tags
- `GET /api/repositories/:name/manifests/:tag` - Get image manifest
- `DELETE /api/repositories/:name/manifests/:digest` - Delete an image

### Statistics & Analytics
- `GET /api/stats` - Comprehensive registry statistics
- `POST /api/stats/refresh` - Force statistics cache refresh

### Settings Management
- `GET /api/settings` - Get current application settings
- `POST /api/settings` - Update settings in real-time
- `POST /api/settings/reset` - Reset settings to environment defaults

### System
- `GET /api/config` - Get registry configuration info

## 🎯 Usage

1. **Access Interface**: Navigate to `http://localhost:3000`
2. **Repository Management**: Browse repositories and tags
3. **Statistics Dashboard**: Monitor usage and storage metrics
4. **Settings Configuration**: Customize interface and behavior
5. **Real-time Updates**: Auto-refresh keeps data current

## 🐳 Production Deployment

### Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  registry-ui:
    build: .
    ports:
      - "3000:3000"
    environment:
      REGISTRY_URL: ${REGISTRY_URL}
      REGISTRY_USERNAME: ${REGISTRY_USERNAME}
      REGISTRY_PASSWORD: ${REGISTRY_PASSWORD}
      DEFAULT_THEME: dark
      CACHE_ENABLED: true
      AUTO_REFRESH_INTERVAL: 600000
    restart: unless-stopped
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: registry-console
spec:
  replicas: 1
  selector:
    matchLabels:
      app: registry-console
  template:
    metadata:
      labels:
        app: registry-console
    spec:
      containers:
      - name: registry-console
        image: registry-console:latest
        ports:
        - containerPort: 3000
        env:
        - name: REGISTRY_URL
          value: "registry.example.com"
        - name: DEFAULT_THEME
          value: "dark"
        - name: CACHE_ENABLED
          value: "true"
```

## 🔐 Security

- **Environment Variables**: Secure credential management via `.env`
- **HTTP Basic Authentication**: Direct integration with Docker Registry auth
- **Input Validation**: Comprehensive request validation and sanitization
- **Confirmation Dialogs**: Mandatory confirmation for destructive operations
- **Audit Logging**: Server-side logging of all operations
- **Container Security**: Non-root user execution in Docker containers

## 🚀 Performance

- **Intelligent Caching**: Configurable cache with TTL for statistics
- **Auto-refresh**: Smart polling system with configurable intervals
- **Responsive Design**: Optimized for all screen sizes
- **Efficient API**: Minimal data transfer with selective loading
- **Background Processing**: Non-blocking statistics calculations

## 📱 Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: Full responsive design for tablets and phones
- **Theme Support**: Automatic dark/light mode detection
- **Accessibility**: WCAG 2.1 compliant interface

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check registry connectivity
curl -u username:password https://registry.example.com/v2/

# Verify environment variables
cat .env | grep REGISTRY
```

### Configuration Issues
```bash
# Check application settings
curl http://localhost:3000/api/settings

# Reset to defaults
curl -X POST http://localhost:3000/api/settings/reset
```

### Performance Issues
- Enable caching in settings (`CACHE_ENABLED=true`)
- Increase cache TTL (`CACHE_TTL=900000`)
- Adjust auto-refresh interval (`AUTO_REFRESH_INTERVAL=600000`)

## 📊 Monitoring

The application provides built-in health checks:
- Health endpoint: `GET /api/settings` (returns 200 if healthy)
- Statistics endpoint: `GET /api/stats` (returns registry metrics)
- Docker health check: Built into container configuration

## 🤝 Contributing

Contributions are welcome! Please:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd registry_ui

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rúben Barbosa**  
Developed with ❤️ for efficient Docker Registry management

---

*Production-ready interface for comprehensive Docker Registry administration with modern UI and flexible configuration.*
