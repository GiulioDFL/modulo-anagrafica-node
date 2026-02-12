const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

router.post('/anagrafica/gestione-sedi/add', async (req, res) => {
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

  const categorie = Array.isArray(cva_tipo_sede_id) ? cva_tipo_sede_id : (cva_tipo_sede_id ? [cva_tipo_sede_id] : []);

  try {
    // 1. Creazione Indirizzo
    const indirizzoData = { via, numero_civico, cap, comune, provincia, paese };
    const indirizzoRecord = await pb.collection('indirizzi').create(indirizzoData);

    // 2. Creazione Sede con relazioni
    const sedeData = {
      societa: societa_id,
      indirizzo: indirizzoRecord.id,
      categorie: categorie // Mappatura su campo 'categorie' (ex cva_tipo_sede_id)
    };
    
    await pb.collection('sedi').create(sedeData);

    res.json({ success: true, message: "Sede inserita con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;
