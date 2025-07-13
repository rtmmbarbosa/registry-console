/**
 * Authentication middleware for Docker Registry UI
 * Provides session-based authentication with secure cookie handling
 */

const bcrypt = require('bcrypt');

/**
 * Authentication middleware to protect routes
 */
const requireAuth = (req, res, next) => {
    // Check if authentication is enabled
    if (process.env.AUTH_ENABLED !== 'true') {
        return next();
    }

    // Check if user is authenticated
    if (req.session && req.session.authenticated) {
        return next();
    }

    // User not authenticated - check request type
    const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
    const isAPIRoute = req.path.startsWith('/api/');
    
    if (acceptsJson || isAPIRoute) {
        // API request - return JSON error
        return res.status(401).json({ 
            error: 'Authentication required',
            redirectTo: '/login'
        });
    }

    // Regular request - redirect to login page
    return res.redirect('/login');
};

/**
 * Check if user is already authenticated (for login page)
 */
const redirectIfAuthenticated = (req, res, next) => {
    // Check if authentication is enabled
    if (process.env.AUTH_ENABLED !== 'true') {
        return res.redirect('/');
    }

    // Check if user is already authenticated
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }

    next();
};

/**
 * Handle login request
 */
const handleLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Username and password are required' 
            });
        }

        // Check credentials
        const envUsername = process.env.AUTH_USERNAME;
        const envPassword = process.env.AUTH_PASSWORD;

        if (!envUsername || !envPassword) {
            console.error('Authentication credentials not configured');
            return res.status(500).json({ 
                error: 'Authentication not properly configured' 
            });
        }

        // Compare username and password
        const usernameMatch = username === envUsername;
        const passwordMatch = await bcrypt.compare(password, envPassword);

        if (!usernameMatch || !passwordMatch) {
            // Add delay to prevent brute force attacks
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // Set session
        req.session.authenticated = true;
        req.session.username = username;
        req.session.loginTime = new Date();

        // Save session and respond
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ 
                    error: 'Login failed' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Login successful',
                redirectTo: '/'
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Login failed' 
        });
    }
};

/**
 * Handle logout request
 */
const handleLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                error: 'Logout failed' 
            });
        }

        res.clearCookie('connect.sid');
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            res.json({ 
                success: true, 
                message: 'Logout successful',
                redirectTo: '/login'
            });
        } else {
            res.redirect('/login');
        }
    });
};

/**
 * Get current user info
 */
const getCurrentUser = (req, res) => {
    if (process.env.AUTH_ENABLED !== 'true') {
        return res.json({ 
            authenticated: false,
            authEnabled: false
        });
    }

    if (req.session && req.session.authenticated) {
        return res.json({
            authenticated: true,
            authEnabled: true,
            username: req.session.username,
            loginTime: req.session.loginTime
        });
    }

    res.json({
        authenticated: false,
        authEnabled: true
    });
};

module.exports = {
    requireAuth,
    redirectIfAuthenticated,
    handleLogin,
    handleLogout,
    getCurrentUser
};
