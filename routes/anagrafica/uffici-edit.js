const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-uffici/edit
router.post('/anagrafica/gestione-uffici/edit', (req, res) => {
  let { id, societa_id, sede_id, cva_tipo_ufficio_id, nome_ufficio } = req.body;

  if (!id) return res.status(400).json({ error: "ID ufficio mancante." });
  if (!societa_id || !cva_tipo_ufficio_id) {
    return res.status(400).json({ error: "Società e Tipo Ufficio sono obbligatori." });
  }

  // Formattazione
  nome_ufficio = (nome_ufficio || '').trim();
  const sedeId = sede_id || null;

  const sql = `UPDATE uffici SET societa_id=?, sede_id=?, cva_tipo_ufficio_id=?, nome_ufficio=? WHERE id=?`;
  
  db.run(sql, [societa_id, sedeId, cva_tipo_ufficio_id, nome_ufficio, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Esiste già un ufficio di questo tipo per questa sede/società." });
      }
      return res.status(500).json({ error: "Errore aggiornamento ufficio: " + err.message });
    }
    
    res.json({ success: true, message: "Ufficio aggiornato con successo", changes: this.changes });
  });
});

module.exports = router;