const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// GET /api/anagrafica/settori
router.get('/api/anagrafica/settori', (req, res) => {
  const sql = "SELECT id, valore FROM chiave_valore_attributo WHERE gruppo = 'SETTORI' ORDER BY valore ASC";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;