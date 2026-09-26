/**
 * Pages Routes - Page content management
 */

const express = require('express');
const router = express.Router();
const { getClient } = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');

/**
 * GET /api/pages - Get all pages with content
 */
router.get('/', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: content, error } = await supabase
            .from('page_content')
            .select('*')
            .order('page_name')
            .order('display_order');

        if (error) throw error;

        const pages = {};
        content.forEach(item => {
            if (!pages[item.page_name]) {
                pages[item.page_name] = [];
            }
            pages[item.page_name].push(item);
        });

        res.json({ success: true, data: pages });
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ success: false, message: 'Error fetching pages' });
    }
});

/**
 * GET /api/pages/:pageName - Get content for a page
 */
router.get('/:pageName', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: content, error } = await supabase
            .from('page_content')
            .select('*')
            .eq('page_name', req.params.pageName)
            .order('display_order');

        if (error) throw error;

        const contentObject = {};
        content.forEach(item => {
            contentObject[item.section_id] = {
                id: item.id,
                title_ar: item.section_title_ar,
                content_ar: item.content_ar,
                type: item.content_type
            };
        });

        res.json({ success: true, page: req.params.pageName, data: contentObject });
    } catch (error) {
        console.error('Get page content error:', error);
        res.status(500).json({ success: false, message: 'Error fetching page content' });
    }
});

/**
 * PUT /api/pages/:pageName/bulk - Bulk update (admin)
 */
router.put('/:pageName/bulk', isAuthenticated, async (req, res) => {
    try {
        const { pageName } = req.params;
        const { sections } = req.body;

        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ success: false, message: 'sections array is required' });
        }

        const supabase = getClient();

        for (const section of sections) {
            const updates = { updated_at: new Date().toISOString() };
            if (section.section_title_ar !== undefined) updates.section_title_ar = section.section_title_ar;
            if (section.content_ar !== undefined) updates.content_ar = section.content_ar;

            await supabase
                .from('page_content')
                .update(updates)
                .eq('page_name', pageName)
                .eq('section_id', section.section_id);
        }

        res.json({ success: true, message: `Updated ${sections.length} sections successfully` });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ success: false, message: 'Error updating sections' });
    }
});

/**
 * GET /api/pages/:pageName/:sectionId - Get specific section
 */
router.get('/:pageName/:sectionId', async (req, res) => {
    try {
        const supabase = getClient();
        const { data: content, error } = await supabase
            .from('page_content')
            .select('*')
            .eq('page_name', req.params.pageName)
            .eq('section_id', req.params.sectionId)
            .single();

        if (error || !content) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Get section error:', error);
        res.status(500).json({ success: false, message: 'Error fetching section' });
    }
});

/**
 * PUT /api/pages/:pageName/:sectionId - Update section (admin)
 */
router.put('/:pageName/:sectionId', isAuthenticated, async (req, res) => {
    try {
        const { pageName, sectionId } = req.params;
        const { section_title_ar, content_ar, content_type } = req.body;

        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('page_content')
            .select('*')
            .eq('page_name', pageName)
            .eq('section_id', sectionId)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const updates = { updated_at: new Date().toISOString() };
        if (section_title_ar !== undefined) updates.section_title_ar = section_title_ar;
        if (content_ar !== undefined) updates.content_ar = content_ar;
        if (content_type !== undefined) updates.content_type = content_type;

        const { data: updated, error } = await supabase
            .from('page_content')
            .update(updates)
            .eq('page_name', pageName)
            .eq('section_id', sectionId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Section updated successfully', data: updated });
    } catch (error) {
        console.error('Update section error:', error);
        res.status(500).json({ success: false, message: 'Error updating section' });
    }
});

/**
 * POST /api/pages/:pageName - Add new section (admin)
 */
router.post('/:pageName', isAuthenticated, async (req, res) => {
    try {
        const { pageName } = req.params;
        const { section_id, section_title_ar, content_ar, content_type, display_order } = req.body;

        if (!section_id || !content_ar) {
            return res.status(400).json({ success: false, message: 'section_id and content_ar are required' });
        }

        const supabase = getClient();

        const { data: existing } = await supabase
            .from('page_content')
            .select('id')
            .eq('page_name', pageName)
            .eq('section_id', section_id)
            .single();

        if (existing) {
            return res.status(400).json({ success: false, message: 'Section already exists' });
        }

        let order = display_order;
        if (!order) {
            const { data: maxRow } = await supabase
                .from('page_content')
                .select('display_order')
                .eq('page_name', pageName)
                .order('display_order', { ascending: false })
                .limit(1)
                .single();
            order = (maxRow?.display_order || 0) + 1;
        }

        const { data: newSection, error } = await supabase
            .from('page_content')
            .insert({
                page_name: pageName,
                section_id,
                section_title_ar: section_title_ar || '',
                content_ar,
                content_type: content_type || 'text',
                display_order: order
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ success: true, message: 'Section created successfully', data: newSection });
    } catch (error) {
        console.error('Create section error:', error);
        res.status(500).json({ success: false, message: 'Error creating section' });
    }
});

/**
 * DELETE /api/pages/:pageName/:sectionId - Delete section (admin)
 */
router.delete('/:pageName/:sectionId', isAuthenticated, async (req, res) => {
    try {
        const { pageName, sectionId } = req.params;
        const supabase = getClient();

        const { data: existing, error: findErr } = await supabase
            .from('page_content')
            .select('id')
            .eq('page_name', pageName)
            .eq('section_id', sectionId)
            .single();

        if (findErr || !existing) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        const { error } = await supabase
            .from('page_content')
            .delete()
            .eq('page_name', pageName)
            .eq('section_id', sectionId);

        if (error) throw error;
        res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
        console.error('Delete section error:', error);
        res.status(500).json({ success: false, message: 'Error deleting section' });
    }
});

module.exports = router;
