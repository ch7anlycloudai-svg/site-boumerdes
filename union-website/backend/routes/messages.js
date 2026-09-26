/**
 * Messages Routes - Handle contact form messages
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * POST /api/messages - Submit contact form (public)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, subject, and message are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        const supabase = getClient();
        const { error } = await supabase
            .from('messages')
            .insert({
                name,
                email,
                phone: phone || null,
                subject,
                message
            });

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

/**
 * GET /api/messages - Get all messages (admin)
 */
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

/**
 * GET /api/messages/unread-count - Get unread count (admin)
 */
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) throw error;
        res.json({ success: true, count: count || 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

/**
 * GET /api/messages/:id - Get single message (admin)
 */
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: message, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, data: message });
    } catch (error) {
        console.error('Get message error:', error);
        res.status(500).json({ success: false, message: 'Error fetching message' });
    }
});

/**
 * PATCH /api/messages/:id/read - Mark as read (admin)
 */
router.patch('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('messages')
            .select('id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Error marking message as read' });
    }
});

/**
 * PATCH /api/messages/:id/unread - Mark as unread (admin)
 */
router.patch('/:id/unread', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('messages')
            .select('id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const { error } = await supabase
            .from('messages')
            .update({ is_read: false })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true, message: 'Message marked as unread' });
    } catch (error) {
        console.error('Mark as unread error:', error);
        res.status(500).json({ success: false, message: 'Error marking message as unread' });
    }
});

/**
 * DELETE /api/messages/:id - Delete message (admin)
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('messages')
            .select('id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
        if (error) throw error;

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, message: 'Error deleting message' });
    }
});

module.exports = router;
