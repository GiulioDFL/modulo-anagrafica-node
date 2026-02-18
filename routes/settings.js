const express = require('express');
const router = express.Router();
const getPb = require('../pocketbase-client');

// GET /settings - Visualizzazione tabella
router.get('/settings', async (req, res) => {
    try {
        const pb = await getPb();
        const records = await pb.collection('categorie').getFullList({
            sort: 'gruppo,chiave'
        });
        res.render('settings', { items: records });
    } catch (err) {
        res.status(500).send("Errore PocketBase: " + err.message);
    }
});

// GET /api/settings/categorie - API JSON per dropdown filtrate per gruppo
router.get('/api/settings/categorie', async (req, res) => {
    try {
        const pb = await getPb();
        const { gruppo } = req.query;
        let filter = '';
        
        if (gruppo) {
            filter = `gruppo = "${(gruppo || '').replace(/"/g, '\\"')}"`;
        }

        const records = await pb.collection('categorie').getFullList({
            filter: filter,
            sort: 'chiave'
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: "Errore recupero categorie: " + err.message });
    }
});

// POST /settings/add - Inserimento
router.post('/settings/add', async (req, res) => {
    const { gruppo, chiave, valore, attributo } = req.body;
    
    try {
        const pb = await getPb();
        const data = {
            gruppo,
            chiave: (chiave || '').toUpperCase(),
            valore,
            attributo
        };
        const record = await pb.collection('categorie').create(data);
        res.json({ success: true, id: record.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /settings/update/:id - Modifica
router.post('/settings/update/:id', async (req, res) => {
    const { gruppo, chiave, valore, attributo } = req.body;
    const { id } = req.params;
    
    try {
        const pb = await getPb();
        const data = {
            gruppo,
            chiave: (chiave || '').toUpperCase(),
            valore,
            attributo
        };
        await pb.collection('categorie').update(id, data);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /settings/delete/:id - Eliminazione
router.post('/settings/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pb = await getPb();
        await pb.collection('categorie').delete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;