/**
 * Media Routes - Hero Slides & Specialties Management
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated: requireAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

function extractStoragePath(url) {
    if (!url) return null;
    const supabaseMarker = '/storage/v1/object/public/uploads/';
    const idx = url.indexOf(supabaseMarker);
    if (idx !== -1) return url.substring(idx + supabaseMarker.length);
    if (url.startsWith('/assets/uploads/')) return url.replace('/assets/uploads/', '');
    return null;
}

// ========================================
// HERO SLIDES ROUTES
// ========================================

router.get('/hero', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: slides, error } = await supabase
            .from('hero_slides')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        res.status(500).json({ success: false, message: 'Error fetching hero slides' });
    }
});

router.get('/hero/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: slides, error } = await supabase
            .from('hero_slides')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data: slides });
    } catch (error) {
        console.error('Error fetching all hero slides:', error);
        res.status(500).json({ success: false, message: 'Error fetching hero slides' });
    }
});

router.post('/hero', requireAuth, async (req, res) => {
    try {
        const { title_ar, subtitle_ar, button_text_ar, image_url, link_url, display_order } = req.body;

        if (!image_url) {
            return res.status(400).json({ success: false, message: 'Image URL is required' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('hero_slides')
            .insert({
                title_ar: title_ar || '',
                subtitle_ar: subtitle_ar || '',
                button_text_ar: button_text_ar || '',
                image_url,
                link_url: link_url || '',
                display_order: display_order || 0
            })
            .select('id')
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Hero slide added', data: { id: data.id } });
    } catch (error) {
        console.error('Error adding hero slide:', error);
        res.status(500).json({ success: false, message: 'Error adding hero slide' });
    }
});

router.put('/hero/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title_ar, subtitle_ar, button_text_ar, image_url, link_url, display_order, is_active } = req.body;

        const supabase = getClient();
        const { error } = await supabase
            .from('hero_slides')
            .update({
                title_ar,
                subtitle_ar,
                button_text_ar,
                image_url, link_url,
                display_order,
                is_active: is_active ? true : false
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Hero slide updated' });
    } catch (error) {
        console.error('Error updating hero slide:', error);
        res.status(500).json({ success: false, message: 'Error updating hero slide' });
    }
});

router.delete('/hero/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        const { data: slide } = await supabase.from('hero_slides').select('image_url').eq('id', id).single();
        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (error) throw error;

        if (slide && slide.image_url) {
            const storagePath = extractStoragePath(slide.image_url);
            if (storagePath) await supabase.storage.from('uploads').remove([storagePath]);
        }

        res.json({ success: true, message: 'Hero slide deleted' });
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        res.status(500).json({ success: false, message: 'Error deleting hero slide' });
    }
});

// ========================================
// SPECIALTIES ROUTES
// ========================================

router.get('/specialties', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: specialties, error } = await supabase
            .from('specialties')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        const parsed = specialties.map(spec => ({
            ...spec,
            items_ar: spec.items_ar ? JSON.parse(spec.items_ar) : []
        }));

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Error fetching specialties:', error);
        res.status(500).json({ success: false, message: 'Error fetching specialties' });
    }
});

router.get('/specialties/all', requireAuth, async (req, res) => {
    try {
        const supabase = getClient();
        const { data: specialties, error } = await supabase
            .from('specialties')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        const parsed = specialties.map(spec => ({
            ...spec,
            items_ar: spec.items_ar ? JSON.parse(spec.items_ar) : []
        }));

        res.json({ success: true, data: parsed });
    } catch (error) {
        console.error('Error fetching all specialties:', error);
        res.status(500).json({ success: false, message: 'Error fetching specialties' });
    }
});

router.get('/specialties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();
        const { data: specialty, error } = await supabase.from('specialties').select('*').eq('id', id).single();

        if (error || !specialty) {
            return res.status(404).json({ success: false, message: 'Specialty not found' });
        }

        specialty.items_ar = specialty.items_ar ? JSON.parse(specialty.items_ar) : [];

        res.json({ success: true, data: specialty });
    } catch (error) {
        console.error('Error fetching specialty:', error);
        res.status(500).json({ success: false, message: 'Error fetching specialty' });
    }
});

router.post('/specialties', requireAuth, async (req, res) => {
    try {
        const { slug, name_ar, icon, description_ar, image_url, video_url, video_type, items_ar, duration_ar, display_order } = req.body;

        if (!name_ar || !slug) {
            return res.status(400).json({ success: false, message: 'name_ar and slug are required' });
        }

        const itemsArJson = Array.isArray(items_ar) ? JSON.stringify(items_ar) : (items_ar || '[]');

        const supabase = getClient();
        const { data, error } = await supabase
            .from('specialties')
            .insert({
                slug,
                name_ar,
                icon: icon || '',
                description_ar: description_ar || '',
                image_url: image_url || '',
                video_url: video_url || '',
                video_type: video_type || 'youtube',
                items_ar: itemsArJson,
                duration_ar: duration_ar || '',
                display_order: display_order || 0
            })
            .select('id')
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Specialty added', data: { id: data.id } });
    } catch (error) {
        console.error('Error adding specialty:', error);
        res.status(500).json({ success: false, message: 'Error adding specialty' });
    }
});

router.put('/specialties/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { slug, name_ar, icon, description_ar, image_url, video_url, video_type, items_ar, duration_ar, display_order, is_active } = req.body;

        const itemsArJson = Array.isArray(items_ar) ? JSON.stringify(items_ar) : items_ar;

        const supabase = getClient();
        const { error } = await supabase
            .from('specialties')
            .update({
                slug, name_ar, icon,
                description_ar,
                image_url, video_url, video_type,
                items_ar: itemsArJson,
                duration_ar,
                display_order,
                is_active: is_active ? true : false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Specialty updated' });
    } catch (error) {
        console.error('Error updating specialty:', error);
        res.status(500).json({ success: false, message: 'Error updating specialty' });
    }
});

router.delete('/specialties/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = getClient();

        const { data: specialty } = await supabase.from('specialties').select('image_url').eq('id', id).single();
        const { error } = await supabase.from('specialties').delete().eq('id', id);
        if (error) throw error;

        if (specialty && specialty.image_url) {
            const storagePath = extractStoragePath(specialty.image_url);
            if (storagePath) await supabase.storage.from('uploads').remove([storagePath]);
        }

        res.json({ success: true, message: 'Specialty deleted' });
    } catch (error) {
        console.error('Error deleting specialty:', error);
        res.status(500).json({ success: false, message: 'Error deleting specialty' });
    }
});

// ========================================
// SITE SETTINGS ROUTE
// ========================================

router.get('/settings', async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase.from('site_settings').select('*');
        if (error) throw error;

        const settings = {};
        data.forEach(s => {
            settings[s.setting_key] = { value_ar: s.value_ar };
        });

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Error fetching settings' });
    }
});

router.put('/settings/:key', requireAuth, async (req, res) => {
    try {
        const { key } = req.params;
        const { value_ar } = req.body;
        const supabase = getClient();

        const { data: existing } = await supabase
            .from('site_settings')
            .select('id')
            .eq('setting_key', key)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('site_settings')
                .update({ value_ar, updated_at: new Date().toISOString() })
                .eq('setting_key', key);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('site_settings')
                .insert({ setting_key: key, value_ar });
            if (error) throw error;
        }

        res.json({ success: true, message: 'Setting updated' });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ success: false, message: 'Error updating setting' });
    }
});

// ========================================
// FILE UPLOAD ROUTES
// ========================================

router.post('/upload/:type', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const type = req.params.type || 'general';
        const ext = path.extname(req.file.originalname).toLowerCase();
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        const storagePath = `${type}/${uniqueName}`;

        const supabase = getClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            return res.status(500).json({ success: false, message: 'Upload failed', error: uploadError.message });
        }

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(storagePath);

        res.json({
            success: true,
            message: 'Image uploaded',
            data: { url: urlData.publicUrl, filename: uniqueName, size: req.file.size }
        });
    } catch (error) {
        console.error('[Upload] Exception:', error.message);
        res.status(500).json({ success: false, message: 'Upload error', error: error.message });
    }
});

router.delete('/upload', requireAuth, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: 'Invalid file URL' });

        const storagePath = extractStoragePath(url);
        if (!storagePath) return res.status(400).json({ success: false, message: 'Invalid file URL' });

        const supabase = getClient();
        const { error } = await supabase.storage.from('uploads').remove([storagePath]);
        if (error) throw error;

        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ success: false, message: 'Error deleting file' });
    }
});

// ========================================
// VIDEO URL HELPERS
// ========================================

router.post('/parse-video', (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ success: false, message: 'Video URL required' });

        const videoInfo = parseVideoUrl(url);
        if (videoInfo) {
            res.json({ success: true, data: videoInfo });
        } else {
            res.status(400).json({ success: false, message: 'Unsupported video URL' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error parsing video URL' });
    }
});

function parseVideoUrl(url) {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) return { type: 'youtube', id: youtubeMatch[1], embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` };

    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1], embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

    const driveMatch = url.match(/(?:drive\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/);
    if (driveMatch) return { type: 'drive', id: driveMatch[1], embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };

    return null;
}

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
        }
    }
    if (error.message === 'Only image files are allowed (jpeg, jpg, png, gif, webp)') {
        return res.status(400).json({ success: false, message: 'Only image files allowed' });
    }
    next(error);
});

module.exports = router;
