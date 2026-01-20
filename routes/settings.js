const express = require('express');
const router = express.Router();
const db = require('../database/definition/init');

// GET /settings - Visualizzazione tabella
router.get('/settings', (req, res) => {
    const sql = "SELECT * FROM chiave_valore_attributo ORDER BY gruppo ASC, chiave ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).send("Errore database: " + err.message);
        }
        res.render('settings', { items: rows });
    });
});

// POST /settings/add - Inserimento
router.post('/settings/add', (req, res) => {
    const { gruppo, chiave, valore, attributo } = req.body;
    // Validazione base
    if (!gruppo || !chiave || !valore) {
        return res.status(400).json({ error: "Gruppo, Chiave e Valore sono obbligatori" });
    }
    
    const sql = "INSERT INTO chiave_valore_attributo (gruppo, chiave, valore, attributo) VALUES (?, ?, ?, ?)";
    db.run(sql, [gruppo, chiave, valore, attributo], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: this.lastID });
    });
});

// POST /settings/update/:id - Modifica
router.post('/settings/update/:id', (req, res) => {
    const { gruppo, chiave, valore, attributo } = req.body;
    const { id } = req.params;
    const sql = "UPDATE chiave_valore_attributo SET gruppo = ?, chiave = ?, valore = ?, attributo = ? WHERE id = ?";
    db.run(sql, [gruppo, chiave, valore, attributo, id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// POST /settings/delete/:id - Eliminazione
router.post('/settings/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM chiave_valore_attributo WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes });
    });
});

module.exports = router;