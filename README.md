# RegistryConsole 🐳

Modern web interface for Docker Registry management with a clean, professional design for efficient container image administration.

## ✨ Features

- **📦 Repository Management**: View all repositories in the registry
- **🏷️ Tag Management**: Complete listing of all tags per repository
- **🗑️ Cleanup**: Safe image deletion with confirmation
- **📊 Statistics**: Usage and storage metrics visualization
- **🔍 Detailed Information**: Access to manifests and image metadata
- **🎨 Modern Interface**: Responsive and intuitive design

## 🚀 Quick Start

### 1. Configuration

```bash
# Clone and enter directory
git clone <repository-url>
cd registryconsole

# Copy and configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
REGISTRY_URL=your-registry-url.com
REGISTRY_USERNAME=your_username
REGISTRY_PASSWORD=your_password
PORT=3000
```

### 2. Local Execution

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Or run in production
npm start
```

### 3. Docker Execution

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
├── public/                 # Frontend (HTML, CSS, JS)
│   ├── index.html         # Main interface
│   ├── styles.css         # Modern styles
│   └── script.js          # Frontend logic
├── server.js              # Express.js server
├── package.json           # Node.js dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker orchestration
└── .env.example          # Configuration template
```

## 🔧 API Endpoints

- `GET /api/repositories` - List all repositories
- `GET /api/repositories/:name/tags` - List repository tags
- `GET /api/repositories/:name/manifests/:tag` - Get image manifest
- `DELETE /api/repositories/:name/manifests/:digest` - Delete an image
- `GET /api/stats` - General registry statistics

## 🎯 Usage

1. **Access**: `http://localhost:3000`
2. **Repositories**: View and manage repositories and tags
3. **Statistics**: Monitor usage and storage
4. **Cleanup**: Safely delete unnecessary images

## 🔐 Security

- HTTP Basic authentication with Docker Registry
- Input validation
- Mandatory confirmation for deletions
- Audit logging

## 📱 Compatibility

- **Browsers**: Chrome, Firefox, Safari, Edge (recent versions)
- **Docker Registry**: API v2
- **Responsive**: Desktop, tablet and mobile

## 🐛 Troubleshooting

### Connection Error
- Check URL and credentials in `.env`
- Verify connectivity with registry
- Check SSL/TLS certificates

### Permission Error
- Confirm user has read/write permissions
- Verify registry configuration

### Performance
- For registries with many images, statistics may take time
- Consider implementing cache for better performance

## 📈 Future Improvements

- [ ] Data caching for better performance
- [ ] Application authentication
- [ ] Report export
- [ ] Push notifications
- [ ] Webhook integration
- [ ] Multiple registry support

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the project
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.

## 👨‍💻 Author

**Rúben Barbosa**  
Developed with ❤️ to facilitate Docker Registry management

---

*Modern and efficient interface for complete management of your private Docker Registry.*
