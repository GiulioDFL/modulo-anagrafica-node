const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');
const fs = require('fs');
const path = require('path');

// GET /api/anagrafica/societa (API Dati JSON)
router.get('/api/anagrafica/societa', (req, res) => {
  try {
    // Lettura del file SQL esterno
    const sqlPath = path.join(__dirname, '../../database/query/get_societa.sql');
    
    if (!fs.existsSync(sqlPath)) {
      return res.status(500).json({ error: "File SQL non trovato: " + sqlPath });
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Mappatura dei parametri per la query dinamica
    const params = {
      ':id': req.query.id || null,
      ':ragione_sociale': req.query.ragione_sociale || '',
      ':partita_iva': req.query.partita_iva || '',
      ':codice_fiscale': req.query.codice_fiscale || '',
      ':codice_destinatario': req.query.codice_destinatario || ''
    };

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Errore nel recupero dati: " + err.message });
      }
      // Restituisce i dati in formato JSON
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;
