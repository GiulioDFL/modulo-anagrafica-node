const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/add
router.post('/anagrafica/gestione-referenti/add', (req, res) => {
  let { societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id, nome, cognome } = req.body;

  const ruoli = Array.isArray(cva_tipo_ruolo_id) ? cva_tipo_ruolo_id : (cva_tipo_ruolo_id ? [cva_tipo_ruolo_id] : []);

  if (!societa_id || ruoli.length === 0) {
    return res.status(400).json({ error: "Società e almeno un Ruolo sono obbligatori." });
  }

  // Normalizzazione parametri opzionali
  const sedeId = sede_id || null;
  const ufficioId = ufficio_id || null;

  const insertReferente = (pId) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1. Crea il referente (entità vuota)
      db.run(`INSERT INTO referenti DEFAULT VALUES`, [], function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Errore creazione referente: " + err.message });
        }
        
        const referenteId = this.lastID;

        // Helper per gestire errori nella catena
        const handleError = (errMsg) => {
          db.run("ROLLBACK");
          res.status(500).json({ error: errMsg });
        };

        // 2. Collega Persona
        db.run(`INSERT INTO legm_referenti_persone (referente_id, persona_id) VALUES (?, ?)`, [referenteId, pId], (err) => {
          if (err) return handleError("Errore collegamento persona: " + err.message);

          // 3. Collega Ruoli
          const stmt = db.prepare("INSERT INTO legm_referenti_attributi (referente_id, attributo_id) VALUES (?, ?)");
          ruoli.forEach(rid => stmt.run(referenteId, rid));
          stmt.finalize((err) => {
            if (err) return handleError("Errore collegamento ruoli: " + err.message);

            // 4. Collega Società
            db.run(`INSERT INTO legm_societa_referenti (societa_id, referente_id) VALUES (?, ?)`, [societa_id, referenteId], (err) => {
              if (err) return handleError("Errore collegamento società: " + err.message);

              // 5. Opzionale: Collega Sede
              const stepSede = (cb) => {
                if (!sedeId) return cb();
                db.run(`INSERT INTO legm_sedi_referenti (sede_id, referente_id) VALUES (?, ?)`, [sedeId, referenteId], cb);
              };

              // 6. Opzionale: Collega Ufficio
              const stepUfficio = (cb) => {
                if (!ufficioId) return cb();
                db.run(`INSERT INTO legm_uffici_referenti (ufficio_id, referente_id) VALUES (?, ?)`, [ufficioId, referenteId], cb);
              };

              stepSede((err) => {
                if (err) return handleError("Errore collegamento sede: " + err.message);
                stepUfficio((err) => {
                  if (err) return handleError("Errore collegamento ufficio: " + err.message);
                  
                  db.run("COMMIT");
                  res.json({ success: true, message: "Referente inserito con successo", id: referenteId });
                });
              });
            });
          });
        });
      });
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