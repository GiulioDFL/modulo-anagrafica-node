const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-uffici/edit
router.post('/anagrafica/gestione-uffici/edit', async (req, res) => {
  let { id, cva_tipo_ufficio_id } = req.body;

  if (!id) return res.status(400).json({ error: "ID ufficio mancante." });
  
  // Gestione array per multi-tag (categorie)
  const categorie = Array.isArray(cva_tipo_ufficio_id) ? cva_tipo_ufficio_id : (cva_tipo_ufficio_id ? [cva_tipo_ufficio_id] : []);

  if (categorie.length === 0) {
    return res.status(400).json({ error: "Almeno un Tipo Ufficio è obbligatorio." });
  }

  try {
    const data = {
      categorie: categorie
    };
    await pb.collection('uffici').update(id, data);
    res.json({ success: true, message: "Ufficio aggiornato con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;