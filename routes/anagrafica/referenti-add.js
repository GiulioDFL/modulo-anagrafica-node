const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/add
router.post('/anagrafica/gestione-referenti/add', (req, res) => {
  let { societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id, nome, cognome } = req.body;

  if (!societa_id || !cva_tipo_ruolo_id) {
    return res.status(400).json({ error: "Società e Ruolo sono obbligatori." });
  }

  // Normalizzazione parametri opzionali
  const sedeId = sede_id || null;
  const ufficioId = ufficio_id || null;

  const insertReferente = (pId) => {
    const sql = `INSERT INTO referenti (societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [societa_id, sedeId, ufficioId, pId, cva_tipo_ruolo_id], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: "Questa persona è già referente per questa società." });
        }
        return res.status(500).json({ error: "Errore inserimento referente: " + err.message });
      }
      res.json({ success: true, message: "Referente inserito con successo", id: this.lastID });
    });
  };

  if (persona_id) {
    insertReferente(persona_id);
  } else if (nome && cognome) {
    // Creazione nuova persona fisica
    const sqlPersona = `INSERT INTO persone_fisiche (nome, cognome) VALUES (?, ?)`;
    db.run(sqlPersona, [nome.trim(), cognome.trim()], function(err) {
      if (err) return res.status(500).json({ error: "Errore creazione persona: " + err.message });
      insertReferente(this.lastID);
    });
  } else {
    return res.status(400).json({ error: "È necessario specificare una persona esistente o Nome e Cognome." });
  }
});

module.exports = router;