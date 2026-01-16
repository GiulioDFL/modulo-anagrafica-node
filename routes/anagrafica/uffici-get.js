const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');
const fs = require('fs');
const path = require('path');

// GET /api/anagrafica/uffici
router.get('/api/anagrafica/uffici', (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '../../database/query/get_uffici.sql');
    if (!fs.existsSync(sqlPath)) return res.status(500).json({ error: "File SQL non trovato" });
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Preparazione del termine di ricerca
    const searchTerm = '%' + (req.query.search || '').trim().toLowerCase() + '%';

    if (!req.query.id && !req.query.societa_id) {
      return res.status(400).json({ error: "Parametro societa_id mancante." });
    }

    const params = {
      ':id': req.query.id || null,
      ':societa_id': req.query.societa_id || null,
      ':sede_id': req.query.sede_id || null,
      ':search': searchTerm
    };

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;