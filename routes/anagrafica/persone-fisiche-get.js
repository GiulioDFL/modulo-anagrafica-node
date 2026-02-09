const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');
const fs = require('fs');
const path = require('path');

// GET /api/anagrafica/persone-fisiche
router.get('/api/anagrafica/persone-fisiche', (req, res) => {
  try {
    const sqlPath = path.join(__dirname, '../../database/query/get_persone_fisiche.sql');
    if (!fs.existsSync(sqlPath)) return res.status(500).json({ error: "File SQL non trovato" });
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const searchTerm = '%' + (req.query.search || '').trim().toLowerCase() + '%';

    const params = {
      ':id': req.query.id || null,
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