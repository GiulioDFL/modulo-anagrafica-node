const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-uffici/add
router.post('/anagrafica/gestione-uffici/add', (req, res) => {
  let { societa_id, sede_id, cva_tipo_ufficio_id, nome_ufficio } = req.body;

  // Validazione base
  if (!societa_id || !cva_tipo_ufficio_id) {
    return res.status(400).json({ error: "Società e Tipo Ufficio sono obbligatori." });
  }

  // Formattazione
  nome_ufficio = (nome_ufficio || '').trim();
  const sedeId = sede_id || null; // Se vuoto, è null (associato alla società)

  const sql = `INSERT INTO uffici (societa_id, sede_id, cva_tipo_ufficio_id, nome_ufficio) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [societa_id, sedeId, cva_tipo_ufficio_id, nome_ufficio], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Esiste già un ufficio di questo tipo per questa sede/società." });
      }
      return res.status(500).json({ error: "Errore inserimento ufficio: " + err.message });
    }
    
    res.json({ success: true, message: "Ufficio inserito con successo", id: this.lastID });
  });
});

module.exports = router;