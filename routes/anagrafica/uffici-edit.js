const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-uffici/edit
router.post('/anagrafica/gestione-uffici/edit', (req, res) => {
  let { id, cva_tipo_ufficio_id, nome_ufficio } = req.body;

  if (!id) return res.status(400).json({ error: "ID ufficio mancante." });
  
  // Gestione array per multi-tag
  const tipi = Array.isArray(cva_tipo_ufficio_id) ? cva_tipo_ufficio_id : (cva_tipo_ufficio_id ? [cva_tipo_ufficio_id] : []);

  if (tipi.length === 0) {
    return res.status(400).json({ error: "Almeno un Tipo Ufficio è obbligatorio." });
  }

  // Formattazione
  nome_ufficio = (nome_ufficio || '').trim();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Aggiorna nome ufficio
    db.run("UPDATE uffici SET nome_ufficio=? WHERE id=?", [nome_ufficio, id], function(err) {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore update ufficio: " + err.message }); }

      // 2. Aggiorna Tipo Ufficio (Link obbligatorio)
      // Rimuoviamo vecchi attributi di tipo e inseriamo il nuovo
      db.run("DELETE FROM legm_uffici_attributi WHERE ufficio_id=?", [id], (err) => {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore pulizia tipo: " + err.message }); }
        
        const stmt = db.prepare("INSERT INTO legm_uffici_attributi (ufficio_id, attributo_id) VALUES (?, ?)");
        tipi.forEach(tid => stmt.run(id, tid));
        
        stmt.finalize(err => {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore insert tipi: " + err.message }); }
          db.run("COMMIT");
          res.json({ success: true, message: "Ufficio aggiornato con successo" });
        });
      });
    });
  });
});

module.exports = router;