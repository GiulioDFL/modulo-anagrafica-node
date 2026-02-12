const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-uffici/delete
router.post('/anagrafica/gestione-uffici/delete', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID ufficio mancante." });
  }

  try {
    await pb.collection('uffici').delete(id);
    res.json({ success: true, message: "Ufficio eliminato con successo." });
  } catch (err) {
    return res.status(500).json({ error: "Errore durante l'eliminazione dell'ufficio: " + err.message });
  }
});

module.exports = router;