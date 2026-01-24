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

      // 2. Inserimento Sede (Record principale)
      db.run(`INSERT INTO sedi DEFAULT VALUES`, function(err) {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore creazione sede: " + err.message }); }
        
        const sedeId = this.lastID;

        // 3. Inserimento Collegamenti (Società, Indirizzo, Tipo Sede)
        const sqlLinks = `
          INSERT INTO legm_societa_sedi (societa_id, sede_id) VALUES (?, ?);
          INSERT INTO legm_sedi_indirizzi (sede_id, indirizzo_id) VALUES (?, ?);
          INSERT INTO legm_sedi_attributi (sede_id, attributo_id) VALUES (?, ?);
        `;

        // Eseguiamo i collegamenti in sequenza o tramite exec se supportato, qui usiamo nesting per sicurezza su lastID
        db.run(`INSERT INTO legm_societa_sedi (societa_id, sede_id) VALUES (?, ?)`, [societa_id, sedeId], (err) => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link società: " + err.message }); }
          db.run(`INSERT INTO legm_sedi_indirizzi (sede_id, indirizzo_id) VALUES (?, ?)`, [sedeId, indirizzoId], (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link indirizzo: " + err.message }); }
            db.run(`INSERT INTO legm_sedi_attributi (sede_id, attributo_id) VALUES (?, ?)`, [sedeId, cva_tipo_sede_id], (err) => {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore link tipo sede: " + err.message }); }
              db.run("COMMIT");
              res.json({ success: true, message: "Sede inserita con successo" });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
