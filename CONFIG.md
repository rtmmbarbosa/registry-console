# Registry Console - Configuration Guide

## Environment Variables

The Registry Console uses environment variables for all configuration, making it perfect for containerized deployments and different environments.

### Required Settings

```bash
REGISTRY_URL=your-registry-url.com
REGISTRY_USERNAME=your-username  
REGISTRY_PASSWORD=your-password
PORT=3000
NODE_ENV=production
```

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_THEME` | `light` | UI theme: `light`, `dark`, or `auto` |
| `AUTO_REFRESH_INTERVAL` | `300000` | Auto-refresh interval in milliseconds (5 minutes) |
| `AUTO_REFRESH_ENABLED` | `true` | Enable/disable automatic refresh |
| `NOTIFICATIONS_ENABLED` | `true` | Enable/disable notifications |
| `CACHE_ENABLED` | `true` | Enable/disable caching |
| `CACHE_TTL` | `300000` | Cache TTL in milliseconds (5 minutes) |
| `STATISTICS_EXPORT_ENABLED` | `true` | Enable/disable statistics export |
| `SETTINGS_EXPORT_ENABLED` | `true` | Enable/disable settings export |

## Quick Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```
## Docker Deployment

### Basic Docker Run
```bash
docker run -d \
  -p 3000:3000 \
  -e REGISTRY_URL=registry.example.com \
  -e REGISTRY_USERNAME=admin \
  -e REGISTRY_PASSWORD=secret \
  -e DEFAULT_THEME=dark \
  -e CACHE_ENABLED=true \
  registry-console
```

### Docker Compose
```bash
# Default configuration
docker-compose up -d

# Production optimized
docker-compose --profile production up -d

# Development mode  
docker-compose --profile development up -d
```

## Runtime API

The application provides REST API endpoints for live configuration:

- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings in real-time
- `POST /api/settings/reset` - Reset to environment defaults

### API Examples

```bash
# Get current settings
curl http://localhost:3000/api/settings

# Update theme and refresh interval
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"defaultTheme": "dark", "autoRefreshInterval": 600000}'

# Reset to environment defaults
curl -X POST http://localhost:3000/api/settings/reset
```

## Environment Examples

### Production Configuration
```env
DEFAULT_THEME=dark
AUTO_REFRESH_INTERVAL=600000
CACHE_ENABLED=true
CACHE_TTL=900000
NOTIFICATIONS_ENABLED=true
SETTINGS_EXPORT_ENABLED=false
```

### Development Configuration  
### Resource-Constrained Configuration
```env
DEFAULT_THEME=light
AUTO_REFRESH_ENABLED=false
NOTIFICATIONS_ENABLED=false
CACHE_ENABLED=false
STATISTICS_EXPORT_ENABLED=false
SETTINGS_EXPORT_ENABLED=false
```

## Kubernetes Deployment

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
        - name: REGISTRY_USERNAME
          valueFrom:
            secretKeyRef:
              name: registry-credentials
              key: username
        - name: REGISTRY_PASSWORD
          valueFrom:
            secretKeyRef:
              name: registry-credentials
              key: password
        - name: DEFAULT_THEME
          value: "dark"
        - name: CACHE_ENABLED
          value: "true"
```

## Features

- ✅ Environment variable configuration
- ✅ Runtime settings API  
- ✅ Modern responsive UI with themes
- ✅ Configurable caching system
- ✅ Auto-refresh with custom intervals
- ✅ Statistics and settings export
- ✅ Full container support
