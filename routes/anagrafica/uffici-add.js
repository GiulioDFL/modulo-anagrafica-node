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

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Inserimento Ufficio
    db.run("INSERT INTO uffici (nome_ufficio) VALUES (?)", [nome_ufficio], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: "Errore inserimento ufficio: " + err.message });
      }
      
      const ufficioId = this.lastID;

      // 2. Collegamento Società
      db.run("INSERT INTO legm_societa_uffici (societa_id, ufficio_id) VALUES (?, ?)", [societa_id, ufficioId], (err) => {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link società: " + err.message }); }

        // 3. Collegamento Tipo Ufficio
        db.run("INSERT INTO legm_uffici_attributi (ufficio_id, attributo_id) VALUES (?, ?)", [ufficioId, cva_tipo_ufficio_id], (err) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link tipo ufficio: " + err.message }); }

          // 4. Collegamento Sede (Opzionale)
          if (sedeId) {
            db.run("INSERT INTO legm_sedi_uffici (sede_id, ufficio_id) VALUES (?, ?)", [sedeId, ufficioId], (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link sede: " + err.message }); }
              db.run("COMMIT");
              res.json({ success: true, message: "Ufficio inserito con successo", id: ufficioId });
            });
          } else {
            db.run("COMMIT");
            res.json({ success: true, message: "Ufficio inserito con successo", id: ufficioId });
          }
        });
      });
    });
  });
});

module.exports = router;