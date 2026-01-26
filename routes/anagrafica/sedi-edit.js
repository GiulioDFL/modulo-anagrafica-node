const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

router.post('/anagrafica/gestione-sedi/edit', (req, res) => {
  let { id, indirizzo_id, cva_tipo_sede_id, via, numero_civico, cap, comune, provincia, paese } = req.body;

  if (!id || !indirizzo_id) return res.status(400).json({ error: "ID mancanti." });

  // Formattazione
  via = (via || '').trim();
  numero_civico = (numero_civico || '').trim();
  cap = (cap || '').trim();
  comune = (comune || '').trim().toUpperCase();
  provincia = (provincia || '').trim().toUpperCase();
  paese = (paese || '').trim().toUpperCase();

  const tipiSede = Array.isArray(cva_tipo_sede_id) ? cva_tipo_sede_id : (cva_tipo_sede_id ? [cva_tipo_sede_id] : []);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Aggiornamento Indirizzo
    const sqlIndirizzo = `UPDATE indirizzi SET via=?, numero_civico=?, cap=?, comune=?, provincia=?, paese=? WHERE id=?`;
    db.run(sqlIndirizzo, [via, numero_civico, cap, comune, provincia, paese, indirizzo_id], function(err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update indirizzo: " + err.message }); }

      // 2. Aggiornamento Tipi Sede (delete/insert)
      const deleteSql = `DELETE FROM legm_sedi_attributi WHERE sede_id = ? AND attributo_id IN (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE')`;
      
      db.run(deleteSql, [id], function(errDel) {
        if (errDel) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Errore aggiornamento tipi sede (delete): " + errDel.message });
        }

        if (tipiSede.length > 0) {
          const stmt = db.prepare("INSERT INTO legm_sedi_attributi (sede_id, attributo_id) VALUES (?, ?)");
          tipiSede.forEach(tid => stmt.run(id, tid));
          stmt.finalize(errIns => {
             if (errIns) { 
                db.run("ROLLBACK"); 
                return res.status(500).json({ error: "Errore inserimento tipi sede: " + errIns.message }); 
             }
             db.run("COMMIT");
             res.json({ success: true, message: "Sede aggiornata con successo" });
          });
        } else {
          db.run("COMMIT");
          res.json({ success: true, message: "Sede aggiornata con successo" });
        }
      });
    });
  });
});

module.exports = router;
