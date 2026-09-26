/**
 * Authentication Routes
 * Handles admin login, logout, and session management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getClient } = require('../models/database');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

/**
 * POST /api/auth/login
 */
router.post('/login', isNotAuthenticated, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const supabase = getClient();
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const isValidPassword = bcrypt.compareSync(password, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;

        res.json({
            success: true,
            message: 'Login successful',
            admin: { id: admin.id, username: admin.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack'
        });
    }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error during logout' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

/**
 * GET /api/auth/check
 */
router.get('/check', (req, res) => {
    if (req.session && req.session.adminId) {
        res.json({
            success: true,
            authenticated: true,
            admin: { id: req.session.adminId, username: req.session.adminUsername }
        });
    } else {
        res.json({ success: true, authenticated: false });
    }
});

/**
 * PUT /api/auth/change-password
 */
router.put('/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const supabase = getClient();
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', req.session.adminId)
            .single();

        if (error || !admin) {
            return res.status(500).json({ success: false, message: 'Admin not found' });
        }

        const isValidPassword = bcrypt.compareSync(currentPassword, admin.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await supabase
            .from('admins')
            .update({ password: hashedPassword })
            .eq('id', req.session.adminId);

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password' });
    }
});

module.exports = router;
