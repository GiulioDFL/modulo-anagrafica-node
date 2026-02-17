const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// GET /api/attributes/:group
// Restituisce tutte le categorie per un determinato gruppo (es. TIPO_UFFICIO, SETTORE)
router.get('/api/attributes/:group', async (req, res) => {
    const { group } = req.params;
    try {
        const pb = await getPb();
        const records = await pb.collection('categorie').getFullList({
            filter: `gruppo = "${group}"`,
            sort: 'valore',
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/attributes/:entity/:id/tags
// Restituisce le categorie (tag) assegnate a una specifica entità (record)
router.get('/api/attributes/:entity/:id/tags', async (req, res) => {
    const { entity, id } = req.params;
    const { group } = req.query;

    // Whitelist delle entità valide e mappatura al nome della collection
    const entityMap = {
        'societa': 'societa',
        'sedi': 'sedi',
        'uffici': 'uffici',
        'referenti': 'referenti',
        'persone-fisiche': 'persone_fisiche'
    };

    const collectionName = entityMap[entity];
    if (!collectionName) {
        return res.status(400).json({ error: 'Entità non valida' });
    }

    try {
        const pb = await getPb();
        const record = await pb.collection(collectionName).getOne(id, {
            expand: 'categorie'
        });

        let categories = record.expand?.categorie || [];

        // Se è specificato un gruppo, filtra le categorie restituite
        if (group && Array.isArray(categories)) {
            categories = categories.filter(cat => cat.gruppo === group);
        }

        res.json(categories);
    } catch (error) {
        if (error.status === 404) return res.status(404).json({ error: 'Record non trovato' });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
