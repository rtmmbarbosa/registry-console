# RegistryConsole - Enhanced Navigation System

## Overview
The RegistryConsole Docker Registry UI has been enhanced with a comprehensive navigation system featuring dedicated pages for Home, Analytics, and Settings.

## Features Implemented

### 🏠 Home Page
- **Repository Management**: Browse and manage Docker repositories
- **Quick Statistics**: Overview of total repositories, images, and storage
- **Repository Details**: View tags, layers, and image metadata
- **Delete Operations**: Remove specific images with confirmation

### 📊 Analytics Page
- **Overview Cards**: Total repositories, images, storage, and health score
- **Size Distribution Chart**: Visual representation of repository sizes
- **Advanced Metrics**: Detailed statistics including averages and health indicators
- **Top Repositories**: Ranking by size with detailed information
- **Real-time Updates**: Auto-refresh every 5 minutes with manual refresh option

### ⚙️ Settings Page
- **Registry Configuration**: View current registry URL
- **Auto-refresh Settings**: Configure refresh intervals (5m, 10m, 15m, 30m, disabled)
- **Theme Management**: Light, Dark, and Auto (system) themes
- **Cache Management**: Clear statistics cache and export data
- **Persistent Settings**: All preferences saved to localStorage

## Technical Implementation

### Navigation System
- **Page-based Architecture**: Clean separation between Home, Analytics, and Settings
- **Dynamic Page Switching**: JavaScript-based navigation with proper state management
- **Active State Management**: Visual indicators for current page
- **Responsive Design**: Mobile-friendly navigation and layouts

### Enhanced Statistics
- **Server-side Caching**: 5-minute TTL for improved performance
- **Comprehensive Metrics**: Repository health, size distribution, and usage patterns
- **Interactive Charts**: Clickable elements with filtering capabilities
- **Performance Optimized**: Efficient data loading and rendering

### User Experience
- **Smooth Transitions**: Fade-in animations for page switching
- **Loading States**: Visual feedback during data loading
- **Toast Notifications**: Success, error, warning, and info messages
- **Theme Persistence**: User preferences saved across sessions
- **Accessibility**: Keyboard navigation and screen reader support

## Usage

### Navigation
- Click on **Home**, **Analytics**, or **Settings** in the sidebar to switch pages
- The active page is highlighted with a blue accent
- Sidebar statistics are only visible on the Home page

### Analytics Features
- **Overview Cards**: Monitor key metrics at a glance
- **Size Distribution**: Understand repository size patterns
- **Top Repositories**: Identify largest repositories
- **Auto-refresh**: Data updates automatically every 5 minutes

### Settings Configuration
- **Refresh Interval**: Choose how often data refreshes
- **Theme**: Select light, dark, or auto theme
- **Cache Management**: Clear cache or export statistics data

## API Endpoints

### Statistics API
- `GET /api/stats` - Get comprehensive registry statistics
- `POST /api/stats/refresh` - Force refresh statistics cache

### Repository API
- `GET /api/repositories` - List all repositories
- `GET /api/repositories/:name/tags` - Get repository tags
- `DELETE /api/repositories/:name/tags/:tag` - Delete specific image

## Configuration

### Environment Variables
- `REGISTRY_URL` - Docker registry URL
- `REGISTRY_USERNAME` - Registry username
- `REGISTRY_PASSWORD` - Registry password
- `PORT` - Server port (default: 3000)

### Client-side Settings
- **Theme**: Stored in localStorage as 'theme'
- **Refresh Interval**: Stored in localStorage as 'refreshInterval'

## Performance Features

### Caching Strategy
- **Statistics Cache**: 5-minute server-side cache with TTL
- **Client Cache**: Efficient DOM updates and state management
- **Lazy Loading**: Data loaded only when needed

### Optimization
- **Minimal DOM Manipulation**: Efficient page switching
- **Debounced Updates**: Prevent excessive API calls
- **Resource Efficient**: Lightweight client-side operations

## Browser Support
- Modern browsers with ES6+ support
- Responsive design for mobile and desktop
- Graceful degradation for older browsers

## Future Enhancements
- User authentication and authorization
- Advanced filtering and search capabilities
- Repository activity monitoring
- Scheduled cleanup operations
- Integration with CI/CD pipelines

## Troubleshooting

### Common Issues
1. **Navigation not working**: Check browser console for JavaScript errors
2. **Statistics not loading**: Verify registry connectivity
3. **Theme not persisting**: Check localStorage permissions
4. **Cache issues**: Use Settings > Clear Statistics Cache

### Debug Mode
Enable debug mode by setting `DEBUG=true` in environment variables for detailed logging.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.
