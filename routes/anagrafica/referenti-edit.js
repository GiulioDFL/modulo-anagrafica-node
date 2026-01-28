const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/edit
router.post('/anagrafica/gestione-referenti/edit', (req, res) => {
  let { id, persona_id, cva_tipo_ruolo_id, nome, cognome } = req.body;

  const ruoli = Array.isArray(cva_tipo_ruolo_id) ? cva_tipo_ruolo_id : (cva_tipo_ruolo_id ? [cva_tipo_ruolo_id] : []);

  if (!id) return res.status(400).json({ error: "ID referente mancante." });
  if (!persona_id || ruoli.length === 0) {
    return res.status(400).json({ error: "Persona e almeno un Ruolo sono obbligatori." });
  }

  // Formattazione
  nome = (nome || '').trim();
  cognome = (cognome || '').trim();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const handleError = (errMsg) => {
      db.run("ROLLBACK");
      res.status(500).json({ error: errMsg });
    };

    // 1. Aggiorna Dati Persona Fisica (Nome/Cognome)
    db.run(`UPDATE persone_fisiche SET nome = ?, cognome = ? WHERE id = ?`, [nome, cognome, persona_id], (err) => {
      if (err) return handleError("Errore aggiornamento anagrafica persona: " + err.message);

      // 2. Aggiorna Ruoli (Delete + Insert)
      db.run(`DELETE FROM legm_referenti_attributi WHERE referente_id = ?`, [id], (err) => {
        if (err) return handleError("Errore pulizia ruoli: " + err.message);

        const stmt = db.prepare("INSERT INTO legm_referenti_attributi (referente_id, attributo_id) VALUES (?, ?)");
        ruoli.forEach(rid => stmt.run(id, rid));
        stmt.finalize((err) => {
          if (err) return handleError("Errore aggiornamento ruoli: " + err.message);
          db.run("COMMIT");
          res.json({ success: true, message: "Referente aggiornato con successo" });
        });
      });
    });
  });
});

module.exports = router;