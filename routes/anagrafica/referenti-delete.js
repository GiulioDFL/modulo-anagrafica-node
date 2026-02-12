const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-referenti/delete
router.post('/anagrafica/gestione-referenti/delete', async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "ID referente mancante." });

  try {
    await pb.collection('referenti').delete(id);
    res.json({ success: true, message: "Referente eliminato con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore eliminazione referente: " + err.message });
  }
});

module.exports = router;