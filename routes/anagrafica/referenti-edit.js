const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-referenti/edit
router.post('/anagrafica/gestione-referenti/edit', async (req, res) => {
  let { id, persona_id, cva_tipo_ruolo_id, nome, cognome } = req.body;

  const ruoli = Array.isArray(cva_tipo_ruolo_id) ? cva_tipo_ruolo_id : (cva_tipo_ruolo_id ? [cva_tipo_ruolo_id] : []);

  if (!id) return res.status(400).json({ error: "ID referente mancante." });
  if (!persona_id || ruoli.length === 0) {
    return res.status(400).json({ error: "Persona e almeno un Ruolo sono obbligatori." });
  }

  // Formattazione
  nome = (nome || '').trim();
  cognome = (cognome || '').trim();

  try {
    // 1. Aggiorna Dati Persona Fisica
    const personaData = {
      nome,
      cognome
    };
    await pb.collection('persone_fisiche').update(persona_id, personaData);

    // 2. Aggiorna Ruoli (Categorie) nel Referente
    // In PocketBase, aggiornare un campo relazione sovrascrive la lista esistente con quella nuova
    const referenteData = {
      categorie: ruoli
    };
    await pb.collection('referenti').update(id, referenteData);

    res.json({ success: true, message: "Referente aggiornato con successo" });

  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;