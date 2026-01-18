const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/add
router.post('/anagrafica/gestione-referenti/add', (req, res) => {
  let { societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id } = req.body;

  if (!societa_id || !persona_id || !cva_tipo_ruolo_id) {
    return res.status(400).json({ error: "Società, Persona e Ruolo sono obbligatori." });
  }

  // Normalizzazione parametri opzionali
  const sedeId = sede_id || null;
  const ufficioId = ufficio_id || null;

  const sql = `INSERT INTO referenti (societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [societa_id, sedeId, ufficioId, persona_id, cva_tipo_ruolo_id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Questa persona è già referente per questa società." });
      }
      return res.status(500).json({ error: "Errore inserimento referente: " + err.message });
    }
    res.json({ success: true, message: "Referente inserito con successo", id: this.lastID });
  });
});

module.exports = router;