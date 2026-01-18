const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/edit
router.post('/anagrafica/gestione-referenti/edit', (req, res) => {
  let { id, societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id } = req.body;

  if (!id) return res.status(400).json({ error: "ID referente mancante." });
  if (!societa_id || !persona_id || !cva_tipo_ruolo_id) {
    return res.status(400).json({ error: "Società, Persona e Ruolo sono obbligatori." });
  }

  const sedeId = sede_id || null;
  const ufficioId = ufficio_id || null;

  const sql = `UPDATE referenti SET societa_id=?, sede_id=?, ufficio_id=?, persona_id=?, cva_tipo_ruolo_id=? WHERE id=?`;
  
  db.run(sql, [societa_id, sedeId, ufficioId, persona_id, cva_tipo_ruolo_id, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Questa persona è già referente per questa società." });
      }
      return res.status(500).json({ error: "Errore aggiornamento referente: " + err.message });
    }
    res.json({ success: true, message: "Referente aggiornato con successo", changes: this.changes });
  });
});

module.exports = router;