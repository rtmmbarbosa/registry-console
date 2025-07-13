# Registry Console - Configuration Guide

## Environment Variables Configuration

The Registry Console now supports configuration through environment variables, making it ideal for containerized deployments. All settings can be configured without rebuilding the container.

### Registry Settings

```bash
REGISTRY_URL=your-registry-url.com
REGISTRY_USERNAME=your-username
REGISTRY_PASSWORD=your-password
PORT=3000
NODE_ENV=production
```

### Application Settings

All application settings can be configured via environment variables:

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

### Usage Examples

#### 1. Basic Setup
```bash
# Copy the template
cp .env.template .env

# Edit with your registry details
nano .env
```

#### 2. Docker Compose
```bash
# Default configuration
docker-compose up registry-ui

# Production optimized
docker-compose --profile production up registry-ui-prod

# Development mode
docker-compose --profile development up registry-ui-dev
```

#### 3. Docker Run
```bash
docker run -d \
  -p 3000:3000 \
  -e REGISTRY_URL=registry.example.com \
  -e REGISTRY_USERNAME=admin \
  -e REGISTRY_PASSWORD=secret \
  -e DEFAULT_THEME=dark \
  -e AUTO_REFRESH_INTERVAL=600000 \
  -e CACHE_ENABLED=true \
  registry-console
```

### API Endpoints

The application provides REST API endpoints for runtime configuration:

- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings
- `POST /api/settings/reset` - Reset to defaults

#### Example API Usage

```bash
# Get current settings
curl http://localhost:3000/api/settings

# Update settings
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"defaultTheme": "dark", "autoRefreshInterval": 600000}'

# Reset to defaults
curl -X POST http://localhost:3000/api/settings/reset
```

### Configuration for Different Environments

#### Production Environment
```bash
DEFAULT_THEME=dark
AUTO_REFRESH_INTERVAL=600000  # 10 minutes
AUTO_REFRESH_ENABLED=true
NOTIFICATIONS_ENABLED=true
CACHE_ENABLED=true
CACHE_TTL=900000             # 15 minutes
STATISTICS_EXPORT_ENABLED=true
SETTINGS_EXPORT_ENABLED=false  # Disable in production
```

#### Development Environment
```bash
DEFAULT_THEME=light
AUTO_REFRESH_INTERVAL=60000   # 1 minute
AUTO_REFRESH_ENABLED=true
NOTIFICATIONS_ENABLED=true
CACHE_ENABLED=false          # Disable for development
STATISTICS_EXPORT_ENABLED=true
SETTINGS_EXPORT_ENABLED=true
```

#### Resource-Constrained Environment
```bash
DEFAULT_THEME=light
AUTO_REFRESH_ENABLED=false
NOTIFICATIONS_ENABLED=false
CACHE_ENABLED=false
STATISTICS_EXPORT_ENABLED=false
SETTINGS_EXPORT_ENABLED=false
```

### Kubernetes Deployment

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
        - name: AUTO_REFRESH_INTERVAL
          value: "600000"
        - name: CACHE_ENABLED
          value: "true"
        - name: CACHE_TTL
          value: "900000"
```

### Features

- ✅ **Environment Variable Configuration** - All settings configurable via environment variables
- ✅ **Runtime Settings API** - Update settings without restart
- ✅ **Modern UI** - Stylized settings page with dark/light theme support
- ✅ **Caching System** - Configurable cache with TTL
- ✅ **Auto-refresh** - Configurable automatic refresh intervals
- ✅ **Export Functions** - Statistics and settings export
- ✅ **Container-friendly** - Perfect for Docker, Kubernetes, and other container platforms

### Migration Notes

The application has been migrated from localStorage-based settings to environment variable-based configuration. This change provides:

1. **Better Container Support** - Settings persist across container restarts
2. **Environment-specific Configuration** - Different settings for dev/prod
3. **Infrastructure as Code** - Settings managed through deployment scripts
4. **Security** - Sensitive settings can be managed through secrets
5. **Scalability** - Consistent configuration across multiple instances
