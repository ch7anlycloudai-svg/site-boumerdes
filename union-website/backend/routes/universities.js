/**
 * Universities Routes - University Management
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

// GET /api/universities - Public, get all active universities ordered by wilaya then display_order
router.get('/', async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .eq('is_active', true)
            .order('wilaya', { ascending: true })
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ success: false, message: 'Error fetching universities' });
    }
});

// GET /api/universities/all - Admin only, get all universities
router.get('/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('universities')
            .select('*')
            .order('wilaya', { ascending: true })
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching all universities:', error);
        res.status(500).json({ success: false, message: 'Error fetching universities' });
    }
});

// POST /api/universities - Admin only, create university
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name_ar, wilaya, website_url, logo_url, display_order } = req.body;

        if (!name_ar || !wilaya) {
            return res.status(400).json({ success: false, message: 'name_ar and wilaya are required' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('universities')
            .insert({
                name_ar,
                wilaya,
                website_url: website_url || '',
                logo_url: logo_url || '',
                display_order: display_order || 0
            })
            .select('id')
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'University added', data: { id: data.id } });
    } catch (error) {
        console.error('Error adding university:', error);
        res.status(500).json({ success: false, message: 'Error adding university' });
    }
});

// PUT /api/universities/:id - Admin only, update university
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name_ar, wilaya, website_url, logo_url, display_order, is_active } = req.body;

        const supabase = getClient();
        const updateData = {
            name_ar,
            wilaya,
            website_url,
            logo_url,
            display_order,
            updated_at: new Date().toISOString()
        };
        if (typeof is_active !== 'undefined') {
            updateData.is_active = is_active ? true : false;
        }

        const { error } = await supabase
            .from('universities')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'University updated' });
    } catch (error) {
        console.error('Error updating university:', error);
        res.status(500).json({ success: false, message: 'Error updating university' });
    }
});

// DELETE /api/universities/:id - Admin only, delete university
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        const { data: uni } = await supabase.from('universities').select('logo_url').eq('id', id).single();
        const { error } = await supabase.from('universities').delete().eq('id', id);
        if (error) throw error;

        if (uni && uni.logo_url) {
            const storagePath = extractStoragePath(uni.logo_url);
            if (storagePath) await supabase.storage.from('uploads').remove([storagePath]);
        }

        res.json({ success: true, message: 'University deleted' });
    } catch (error) {
        console.error('Error deleting university:', error);
        res.status(500).json({ success: false, message: 'Error deleting university' });
    }
});

module.exports = router;
