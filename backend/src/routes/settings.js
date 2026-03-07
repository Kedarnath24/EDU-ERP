const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const TABLE = 'integrations';

// ─────────────────────────────────────────────────────────────
// GET /api/settings/integrations
// Returns all configurations
// ─────────────────────────────────────────────────────────────
router.get('/integrations', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*');

        if (error) throw error;

        return res.json({ integrations: data || [] });
    } catch (err) {
        console.error('Fetch all integrations error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/settings/integrations/:id
// Returns the configuration for a specific integration.
// ─────────────────────────────────────────────────────────────
router.get('/integrations/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from(TABLE)
            .select('config, is_active')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Fetch integration error:', error);
            return res.status(500).json({ error: 'Failed to fetch integration configuration' });
        }

        if (!data) {
            return res.json({ integration: { config: {}, is_active: false } });
        }

        return res.json({ integration: data });
    } catch (err) {
        console.error('Fetch integration unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/settings/integrations/:id
// Upsert the configuration for an integration.
// ─────────────────────────────────────────────────────────────
router.post('/integrations/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { config, is_active = true } = req.body;

        const { data, error } = await supabase
            .from(TABLE)
            .upsert({
                id,
                config,
                is_active,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) {
            console.error('Save integration error:', error);
            return res.status(500).json({ error: 'Failed to save integration configuration' });
        }

        return res.json({ message: 'Integration configured successfully', integration: data });
    } catch (err) {
        console.error('Save integration unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
