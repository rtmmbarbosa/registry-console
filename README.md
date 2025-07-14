# <img src="public/logo.svg" alt="RegistryConsole" width="32" height="32" style="vertical-align: middle;"> RegistryConsole

> **♪ Vibe Coding Project**  
> This tool was developed during a collaborative vibe coding session to improve and facilitate private Docker registry management. Created by Ruben Barbosa and GitHub Copilot through experimental exploration of modern web technologies and registry APIs.

Modern web interface for Docker Registry management with authentication, environment-based configuration, and comprehensive security features - perfect for production deployments and containerized environments.

## ✨ Features

- **▸ Authentication System**: Secure login with session management and route protection
- **▸ Repository Management**: View and manage all repositories in the registry
- **▸ Tag Management**: Complete listing and management of tags per repository
- **▸ Safe Cleanup**: Image deletion with confirmation dialogs
- **▸ Advanced Analytics**: Real-time usage and storage metrics with caching
- **▸ Modern Settings**: Environment-based configuration with live updates
- **▸ Clean Dark Theme**: Modern UI with solid colors and true dark mode
- **▸ Auto-refresh**: Configurable automatic data refresh
- **▸ Export Features**: Statistics and settings export capabilities
- **▸ Container-Ready**: Full Docker and Kubernetes support

## ◦ Project Structure

```
registry_ui/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Multi-container setup
├── .env.example           # Environment variables template
├── middleware/
│   └── auth.js            # Authentication middleware
└── public/
    ├── index.html         # Main application interface
    ├── login.html         # Authentication page
    ├── script.js          # Frontend JavaScript
    ├── styles.css         # Application styles
    └── logo.svg           # Application logo
```

## ◦ Theme & Design

### Dark Mode
- **True Dark**: Deep black background (#0f0f0f) for reduced eye strain
- **True Dark**: Deep black background (#0f0f0f) for reduced eye strain
- **Solid Colors**: Clean interface without gradients for better readability
- **Consistent Icons**: SVG outline icons throughout the interface
- **Accessible**: High contrast ratios and proper color coordination

### Light Mode
- **Warm Colors**: Soft, professional color palette
- **Clean Typography**: Easy-to-read fonts with proper spacing
- **Intuitive Layout**: Logical organization of interface elements

## ▸ Quick Start

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

# Authentication Configuration
AUTH_ENABLED=true
AUTH_USERNAME=admin
AUTH_PASSWORD=$2b$10$TYPp33iP8dHvzB8cwW.Mr.L4b6YbQ5ZcjFbDngCHz4dOnjAui3v8O
SESSION_SECRET=your-secret-key-change-in-production

### 3. Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Build and run manually
docker build -t registry-ui .
docker run -p 3000:3000 --env-file .env registry-ui
```

## ◦ API Endpoints

### Registry Management
- `GET /api/repositories` - List all repositories
- `GET /api/repositories/:name/tags` - List repository tags
- `GET /api/repositories/:name/manifests/:tag` - Get image manifest
- `DELETE /api/repositories/:name/manifests/:digest` - Delete an image

### Statistics & Settings
- `GET /api/stats` - Registry statistics
- `GET /api/settings` - Application settings
- `POST /api/settings` - Update settings

## ▸ Security

- **Authentication**: Configurable login system with session management
- **Route Protection**: All endpoints protected with authentication middleware
- **Environment Variables**: Secure credential management via `.env`

### Authentication Setup

1. **Enable Authentication**:
```env
AUTH_ENABLED=true
AUTH_USERNAME=admin
```

2. **Generate Password Hash**:
```bash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10));"
```

3. **Default Credentials**: 
   - Username: `admin`
   - Password: `admin` (change in production!)

## ▸ Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: Full responsive design
- **Theme Support**: Automatic dark/light mode detection

## ▸ Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## ▸ License

This project is licensed under the MIT License.

## ♪ About This Project

This project was created during a **vibe coding session** - a collaborative creative exploration of modern web technologies focused on improving private Docker registry management. Developed by **Ruben Barbosa** and **GitHub Copilot** through experimental prototyping and iterative discovery.

**Vibe Coding Characteristics:**
- ▸ Free experimentation with cutting-edge technologies
- ▸ Rapid prototyping and iterative development  
- ▸ Exploration of concepts without commercial pressure
- ▸ Focus on learning, discovery, and practical solutions
- ▸ Human-AI collaborative development

The goal was to create a practical tool that simplifies private registry management while exploring the boundaries of modern web development and AI-assisted coding.

---

*Modern interface for comprehensive Docker Registry management - A collaborative vibe coding exploration.*
