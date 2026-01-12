const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

router.post('/anagrafica/gestione-sedi/add', (req, res) => {
  let { societa_id, cva_tipo_sede_id, via, numero_civico, cap, comune, provincia, paese } = req.body;

  // Validazione base
  if (!societa_id || !cva_tipo_sede_id || !paese) {
    return res.status(400).json({ error: "Società, Tipo Sede e Paese sono obbligatori." });
  }

  // Formattazione
  via = (via || '').trim();
  numero_civico = (numero_civico || '').trim();
  cap = (cap || '').trim();
  comune = (comune || '').trim().toUpperCase();
  provincia = (provincia || '').trim().toUpperCase();
  paese = (paese || '').trim().toUpperCase();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Inserimento Indirizzo
    const sqlIndirizzo = `INSERT INTO indirizzi (via, numero_civico, cap, comune, provincia, paese) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sqlIndirizzo, [via, numero_civico, cap, comune, provincia, paese], function(err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore indirizzo: " + err.message }); }
      
      const indirizzoId = this.lastID;

      // 2. Inserimento Sede
      const sqlSede = `INSERT INTO sedi (societa_id, indirizzo_id, cva_tipo_sede_id) VALUES (?, ?, ?)`;
      db.run(sqlSede, [societa_id, indirizzoId, cva_tipo_sede_id], function(err) {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore sede (possibile duplicato o trigger): " + err.message }); }
        
        db.run("COMMIT");
        res.json({ success: true, message: "Sede inserita con successo" });
      });
    });
  });
});

module.exports = router;
