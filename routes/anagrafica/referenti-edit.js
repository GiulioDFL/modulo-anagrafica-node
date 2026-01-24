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

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const handleError = (errMsg) => {
      db.run("ROLLBACK");
      res.status(500).json({ error: errMsg });
    };

    // 1. Aggiorna Persona
    db.run(`UPDATE legm_referenti_persone SET persona_id = ? WHERE referente_id = ?`, [persona_id, id], (err) => {
      if (err) return handleError("Errore aggiornamento persona: " + err.message);

      // 2. Aggiorna Ruolo
      db.run(`UPDATE legm_referenti_attributi SET attributo_id = ? WHERE referente_id = ?`, [cva_tipo_ruolo_id, id], (err) => {
        if (err) return handleError("Errore aggiornamento ruolo: " + err.message);

        // 3. Aggiorna Società
        db.run(`UPDATE legm_societa_referenti SET societa_id = ? WHERE referente_id = ?`, [societa_id, id], (err) => {
          if (err) return handleError("Errore aggiornamento società: " + err.message);

          // 4. Gestione Sede (Delete + Insert per gestire opzionalità)
          db.run(`DELETE FROM legm_sedi_referenti WHERE referente_id = ?`, [id], (err) => {
            if (err) return handleError("Errore pulizia sede: " + err.message);
            
            const stepSede = (cb) => {
              if (!sedeId) return cb();
              db.run(`INSERT INTO legm_sedi_referenti (sede_id, referente_id) VALUES (?, ?)`, [sedeId, id], cb);
            };

            stepSede((err) => {
              if (err) return handleError("Errore aggiornamento sede: " + err.message);

              // 5. Gestione Ufficio (Delete + Insert)
              db.run(`DELETE FROM legm_uffici_referenti WHERE referente_id = ?`, [id], (err) => {
                if (err) return handleError("Errore pulizia ufficio: " + err.message);

                const stepUfficio = (cb) => {
                  if (!ufficioId) return cb();
                  db.run(`INSERT INTO legm_uffici_referenti (ufficio_id, referente_id) VALUES (?, ?)`, [ufficioId, id], cb);
                };

                stepUfficio((err) => {
                  if (err) return handleError("Errore aggiornamento ufficio: " + err.message);
                  
                  db.run("COMMIT");
                  res.json({ success: true, message: "Referente aggiornato con successo" });
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;