/**
 * Authentication Middleware
 * Protects admin routes and manages sessions
 */

/**
 * Check if user is authenticated
 * Use this middleware on routes that require login
 */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.adminId) {
        // User is logged in, continue to the route
        return next();
    }
    // User is not logged in
    res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login first.'
    });
}

/**
 * Check if user is NOT authenticated
 * Use this for login page (redirect if already logged in)
 */
function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.adminId) {
        // Already logged in
        res.status(400).json({
            success: false,
            message: 'Already logged in.'
        });
    } else {
        // Not logged in, continue
        next();
    }
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated
};
