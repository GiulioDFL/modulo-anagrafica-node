const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// GET /api/tipi-ruolo
router.get('/api/tipi-ruolo', (req, res) => {
  const sql = "SELECT id, valore FROM chiave_valore_attributo WHERE gruppo = 'TIPI_RUOLO' ORDER BY valore ASC";
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;