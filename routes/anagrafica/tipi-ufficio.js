const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

router.get('/api/tipi-ufficio', (req, res) => {
    db.all("SELECT * FROM chiave_valore_attributo WHERE gruppo = 'TIPI_UFFICIO'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;