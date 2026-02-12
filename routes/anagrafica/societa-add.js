const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-societa/add (Inserimento)
router.post('/anagrafica/gestione-societa/add', async (req, res) => {
  let { ragione_sociale, partita_iva, codice_fiscale, codice_destinatario, cva_settore_id } = req.body;

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

  // Preparazione payload per PocketBase
  const settori = Array.isArray(cva_settore_id) ? cva_settore_id : (cva_settore_id ? [cva_settore_id] : []);

  const data = {
    ragione_sociale,
    partita_iva: partita_iva || null,
    codice_fiscale: codice_fiscale || null,
    codice_destinatario: codice_destinatario || null,
    categorie: settori // Mappatura corretta sul campo 'categorie' di PocketBase
  };

  try {
    const record = await pb.collection('societa').create(data);
    res.json({ success: true, message: "Società inserita con successo", id: record.id });
  } catch (err) {
    // Gestione errore duplicati (es. Partita IVA) basata sulla risposta di PocketBase
    if (err.status === 400 && err.response?.data?.partita_iva) {
      return res.status(400).json({ error: "Esiste già una società con questa Partita IVA." });
    }
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;
