const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-societa/add (Inserimento)
router.post('/anagrafica/gestione-societa/add', (req, res) => {
  let { ragione_sociale, partita_iva, codice_fiscale, codice_destinatario } = req.body;

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

  // P.IVA: deve essere numerica di 11 cifre
  if (partita_iva && !/^\d{11}$/.test(partita_iva)) {
    errors.push("La Partita IVA deve essere composta da 11 cifre numeriche.");
  }

  // Codice Fiscale: alfanumerico, 11 (persone giuridiche) o 16 (fisiche) caratteri
  if (codice_fiscale && !/^[A-Z0-9]{11,16}$/.test(codice_fiscale)) {
    errors.push("Il Codice Fiscale deve essere alfanumerico (11 o 16 caratteri).");
  }

  // Codice Destinatario: 7 caratteri alfanumerici
  if (codice_destinatario && !/^[A-Z0-9]{7}$/.test(codice_destinatario)) {
    errors.push("Il Codice Destinatario deve essere di 7 caratteri alfanumerici.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("\n") });
  }

  // Preparazione valori (null se stringa vuota per coerenza DB)
  const pIva = partita_iva || null;
  const cFisc = codice_fiscale || null;
  const cDest = codice_destinatario || null;

  const sql = `INSERT INTO societa (ragione_sociale, partita_iva, codice_fiscale, codice_destinatario) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [ragione_sociale, pIva, cFisc, cDest], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "Esiste già una società con questa Partita IVA." });
      }
      return res.status(500).json({ error: "Errore inserimento: " + err.message });
    }
    res.json({ success: true, message: "Società inserita con successo", id: this.lastID });
  });
});

module.exports = router;
