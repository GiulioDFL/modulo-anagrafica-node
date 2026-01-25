// routes/api/attributes.js
const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// GET /api/attributes/:group
// Restituisce le opzioni disponibili per un determinato gruppo (es. TIPI_UFFICIO, SETTORI)
router.get('/api/attributes/:group', (req, res) => {
    const { group } = req.params;
    const sql = "SELECT id, valore FROM chiave_valore_attributo WHERE gruppo = ? ORDER BY valore";
    db.all(sql, [group], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /api/attributes/:entity/:id/tags
// Restituisce i tag assegnati a una specifica entità
router.get('/api/attributes/:entity/:id/tags', (req, res) => {
    const { entity, id } = req.params;
    const { group } = req.query;

    let table = '';
    let entityCol = '';

    switch (entity) {
        case 'societa':
            table = 'legm_societa_attributi';
            entityCol = 'societa_id';
            break;
        case 'sedi':
            table = 'legm_sedi_attributi';
            entityCol = 'sede_id';
            break;
        case 'uffici':
            table = 'legm_uffici_attributi';
            entityCol = 'ufficio_id';
            break;
        case 'referenti':
            table = 'legm_referenti_attributi';
            entityCol = 'referente_id';
            break;
        default:
            return res.status(400).json({ error: 'Entità non valida' });
    }

    let sql = `
        SELECT cva.id, cva.valore 
        FROM ${table} legm
        JOIN chiave_valore_attributo cva ON legm.attributo_id = cva.id
        WHERE legm.${entityCol} = ?
    `;

    const params = [id];

    if (group) {
        sql += " AND cva.gruppo = ?";
        params.push(group);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
