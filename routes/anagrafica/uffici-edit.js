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

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Aggiorna nome ufficio
    db.run("UPDATE uffici SET nome_ufficio=? WHERE id=?", [nome_ufficio, id], function(err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update ufficio: " + err.message }); }

      // 2. Aggiorna Società (Link obbligatorio)
      // Cancelliamo e reinseriamo per sicurezza, o aggiorniamo. Qui aggiorniamo.
      db.run("UPDATE legm_societa_uffici SET societa_id=? WHERE ufficio_id=?", [societa_id, id], (err) => {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update società: " + err.message }); }

        // 3. Aggiorna Tipo Ufficio (Link obbligatorio)
        // Rimuoviamo vecchi attributi di tipo e inseriamo il nuovo
        db.run("DELETE FROM legm_uffici_attributi WHERE ufficio_id=?", [id], (err) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore pulizia tipo: " + err.message }); }
          
          db.run("INSERT INTO legm_uffici_attributi (ufficio_id, attributo_id) VALUES (?, ?)", [id, cva_tipo_ufficio_id], (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore insert tipo: " + err.message }); }

            // 4. Aggiorna Sede (Link opzionale)
            db.run("DELETE FROM legm_sedi_uffici WHERE ufficio_id=?", [id], (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore pulizia sede: " + err.message }); }

              if (sedeId) {
                db.run("INSERT INTO legm_sedi_uffici (sede_id, ufficio_id) VALUES (?, ?)", [sedeId, id], (err) => {
                  if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore insert sede: " + err.message }); }
                  db.run("COMMIT");
                  res.json({ success: true, message: "Ufficio aggiornato con successo" });
                });
              } else {
                db.run("COMMIT");
                res.json({ success: true, message: "Ufficio aggiornato con successo" });
              }
            });
          });
        });
      });
    });
  });
});

module.exports = router;