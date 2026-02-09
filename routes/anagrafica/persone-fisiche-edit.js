const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-persone-fisiche/edit
router.post('/anagrafica/gestione-persone-fisiche/edit', (req, res) => {
  let { id, nome, cognome, data_nascita, codice_fiscale, cva_tipo_competenza_id } = req.body;

  if (!id) return res.status(400).json({ error: "ID persona mancante." });

  // Formattazione
  nome = (nome || '').trim();
  cognome = (cognome || '').trim();
  codice_fiscale = (codice_fiscale || '').trim().toUpperCase();
  data_nascita = (data_nascita || '').trim();

  const competenze = Array.isArray(cva_tipo_competenza_id) ? cva_tipo_competenza_id : (cva_tipo_competenza_id ? [cva_tipo_competenza_id] : []);

  // Validazione
  if (!nome || !cognome) {
    return res.status(400).json({ error: "Nome e Cognome sono obbligatori." });
  }

  if (codice_fiscale && !/^[A-Z0-9]{16}$/.test(codice_fiscale)) {
    return res.status(400).json({ error: "Il Codice Fiscale deve essere di 16 caratteri alfanumerici." });
  }

  const cf = codice_fiscale || null;
  const dn = data_nascita || null;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const handleError = (errMsg) => {
      db.run("ROLLBACK");
      res.status(500).json({ error: errMsg });
    };

    // 1. Aggiorna Dati Persona
    const sqlUpdate = `UPDATE persone_fisiche SET nome = ?, cognome = ?, data_nascita = ?, codice_fiscale = ? WHERE id = ?`;
    
    db.run(sqlUpdate, [nome, cognome, dn, cf, id], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Esiste già una persona con questo Codice Fiscale." });
        }
        return handleError("Errore aggiornamento anagrafica persona: " + err.message);
      }

      // 2. Aggiorna Competenze (Delete + Insert)
      // Filtriamo per gruppo TIPI_COMPETENZA per evitare di cancellare altri attributi futuri
      const sqlDelete = `DELETE FROM legm_persone_fisiche_attributi WHERE persona_id = ? AND attributo_id IN (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_COMPETENZA')`;

      db.run(sqlDelete, [id], (err) => {
        if (err) return handleError("Errore pulizia competenze: " + err.message);

        if (competenze.length > 0) {
          const stmt = db.prepare("INSERT INTO legm_persone_fisiche_attributi (persona_id, attributo_id) VALUES (?, ?)");
          competenze.forEach(cid => stmt.run(id, cid));
          stmt.finalize((err) => {
            if (err) return handleError("Errore aggiornamento competenze: " + err.message);
            db.run("COMMIT");
            res.json({ success: true, message: "Persona fisica aggiornata con successo" });
          });
        } else {
          db.run("COMMIT");
          res.json({ success: true, message: "Persona fisica aggiornata con successo" });
        }
      });
    });
  });
});

module.exports = router;
