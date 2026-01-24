const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-societa/edit (Modifica)
router.post('/anagrafica/gestione-societa/edit', (req, res) => {
  let { id, ragione_sociale, partita_iva, codice_fiscale, codice_destinatario, cva_settore_id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID società mancante." });
  }

  // 1. Formattazione e Pulizia Dati
  ragione_sociale = (ragione_sociale || '').trim().toUpperCase();
  partita_iva = (partita_iva || '').trim();
  codice_fiscale = (codice_fiscale || '').trim().toUpperCase();
  codice_destinatario = (codice_destinatario || '').trim().toUpperCase();

  // 2. Validazione Rigorosa
  const errors = [];

  if (!ragione_sociale) {
    errors.push("La Ragione Sociale è obbligatoria.");
  }

  if (partita_iva && !/^\d{11}$/.test(partita_iva)) {
    errors.push("La Partita IVA deve essere composta da 11 cifre numeriche.");
  }

  if (codice_fiscale && !/^[A-Z0-9]{11,16}$/.test(codice_fiscale)) {
    errors.push("Il Codice Fiscale deve essere alfanumerico (11 o 16 caratteri).");
  }

  if (codice_destinatario && !/^[A-Z0-9]{7}$/.test(codice_destinatario)) {
    errors.push("Il Codice Destinatario deve essere di 7 caratteri alfanumerici.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("\n") });
  }

  const pIva = partita_iva || null;
  const cFisc = codice_fiscale || null;
  const cDest = codice_destinatario || null;
  const settori = Array.isArray(cva_settore_id) ? cva_settore_id : (cva_settore_id ? [cva_settore_id] : []);

  const sql = `UPDATE societa SET ragione_sociale = ?, partita_iva = ?, codice_fiscale = ?, codice_destinatario = ? WHERE id = ?`;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run(sql, [ragione_sociale, pIva, cFisc, cDest, id], function(err) {
      if (err) {
        db.run("ROLLBACK");
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: "Esiste già una società con questa Partita IVA." });
        }
        return res.status(500).json({ error: "Errore aggiornamento: " + err.message });
      }

      // Cancella i settori esistenti per questa società
      const deleteSql = `DELETE FROM legm_societa_attributi WHERE societa_id = ? AND attributo_id IN (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'SETTORI')`;
      
      db.run(deleteSql, [id], function(errDel) {
        if (errDel) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Errore aggiornamento settori (delete): " + errDel.message });
        }

        if (settori.length > 0) {
          const stmt = db.prepare("INSERT INTO legm_societa_attributi (societa_id, attributo_id) VALUES (?, ?)");
          settori.forEach(sid => stmt.run(id, sid));
          stmt.finalize(errIns => {
             if (errIns) { db.run("ROLLBACK"); return res.status(500).json({ error: "Errore inserimento settori" }); }
             db.run("COMMIT");
             res.json({ success: true, message: "Società aggiornata con successo" });
          });
        } else {
          db.run("COMMIT");
          res.json({ success: true, message: "Società aggiornata con successo" });
        }
      });
    });
  });
});

module.exports = router;
