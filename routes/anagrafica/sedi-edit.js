const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

router.post('/anagrafica/gestione-sedi/edit', async (req, res) => {
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

  try {
    // 1. Aggiornamento Indirizzo
    const indirizzoData = { via, numero_civico, cap, comune, provincia, paese };
    await pb.collection('indirizzi').update(indirizzo_id, indirizzoData);

    // 2. Aggiornamento Sede (Categorie)
    const sedeData = {
      categorie: tipiSede
    };
    await pb.collection('sedi').update(id, sedeData);

    res.json({ success: true, message: "Sede aggiornata con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;
