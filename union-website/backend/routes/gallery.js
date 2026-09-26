/**
 * Gallery Routes - Photo Gallery Management
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated: requireAuth } = require('../middleware/auth');

function extractStoragePath(url) {
    if (!url) return null;
    const supabaseMarker = '/storage/v1/object/public/uploads/';
    const idx = url.indexOf(supabaseMarker);
    if (idx !== -1) return url.substring(idx + supabaseMarker.length);
    if (url.startsWith('/assets/uploads/')) return url.replace('/assets/uploads/', '');
    return null;
}

// ========================================
// GALLERY ROUTES
// ========================================

// GET /api/gallery - Public, get active gallery images ordered by display_order
router.get('/', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: images, error } = await supabase
            .from('gallery')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: images });
    } catch (error) {
        console.error('Error fetching gallery images:', error);
        res.status(500).json({ success: false, message: 'Error fetching gallery images' });
    }
});

// GET /api/gallery/all - Admin only, get all gallery images
router.get('/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: images, error } = await supabase
            .from('gallery')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: images });
    } catch (error) {
        console.error('Error fetching all gallery images:', error);
        res.status(500).json({ success: false, message: 'Error fetching gallery images' });
    }
});

// POST /api/gallery - Admin only, create gallery image
router.post('/', requireAuth, async (req, res) => {
    try {
        const { image_url, caption_ar, display_order, album_ar } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, message: 'Image URL is required' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('gallery')
            .insert({
                image_url,
                caption_ar: caption_ar || '',
                display_order: display_order || 0,
                album_ar: album_ar || 'عام'
            })
            .select('id')
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Gallery image added', data: { id: data.id } });
    } catch (error) {
        console.error('Error adding gallery image:', error);
        res.status(500).json({ success: false, message: 'Error adding gallery image' });
    }
});

// PUT /api/gallery/:id - Admin only, update gallery image
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, caption_ar, display_order, is_active, album_ar } = req.body;

        const supabase = getClient();
        const { error } = await supabase
            .from('gallery')
            .update({
                image_url,
                caption_ar,
                display_order,
                is_active: is_active ? true : false,
                album_ar
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Gallery image updated' });
    } catch (error) {
        console.error('Error updating gallery image:', error);
        res.status(500).json({ success: false, message: 'Error updating gallery image' });
    }
});

// DELETE /api/gallery/:id - Admin only, delete image (also delete from Supabase Storage)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        const { data: image } = await supabase.from('gallery').select('image_url').eq('id', id).single();
        const { error } = await supabase.from('gallery').delete().eq('id', id);
        if (error) throw error;

        if (image && image.image_url) {
            const storagePath = extractStoragePath(image.image_url);
            if (storagePath) await supabase.storage.from('uploads').remove([storagePath]);
        }

        res.json({ success: true, message: 'Gallery image deleted' });
    } catch (error) {
        console.error('Error deleting gallery image:', error);
        res.status(500).json({ success: false, message: 'Error deleting gallery image' });
    }
});

module.exports = router;
