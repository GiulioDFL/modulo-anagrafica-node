const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

router.post('/anagrafica/gestione-sedi/edit', (req, res) => {
  let { id, indirizzo_id, societa_id, cva_tipo_sede_id, via, numero_civico, cap, comune, provincia, paese } = req.body;

  if (!id || !indirizzo_id) return res.status(400).json({ error: "ID mancanti." });

  // Formattazione
  via = (via || '').trim();
  numero_civico = (numero_civico || '').trim();
  cap = (cap || '').trim();
  comune = (comune || '').trim().toUpperCase();
  provincia = (provincia || '').trim().toUpperCase();
  paese = (paese || '').trim().toUpperCase();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Aggiornamento Indirizzo
    const sqlIndirizzo = `UPDATE indirizzi SET via=?, numero_civico=?, cap=?, comune=?, provincia=?, paese=? WHERE id=?`;
    db.run(sqlIndirizzo, [via, numero_civico, cap, comune, provincia, paese, indirizzo_id], function(err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update indirizzo: " + err.message }); }

      // 2. Aggiornamento Collegamenti
      // Aggiorna Società
      db.run(`UPDATE legm_societa_sedi SET societa_id=? WHERE sede_id=?`, [societa_id, id], function(err) {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update link società: " + err.message }); }

        // Aggiorna Tipo Sede (cerca l'attributo che appartiene al gruppo TIPI_SEDE per questa sede)
        const sqlUpdateTipo = `
          UPDATE legm_sedi_attributi 
          SET attributo_id = ? 
          WHERE sede_id = ? 
          AND attributo_id IN (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE')
        `;
        db.run(sqlUpdateTipo, [cva_tipo_sede_id, id], function(err) {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update link tipo sede: " + err.message }); }
          
          db.run("COMMIT");
          res.json({ success: true, message: "Sede aggiornata con successo" });
        });
      });
    });
  });
});

module.exports = router;
