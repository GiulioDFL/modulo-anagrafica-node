const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// GET /api/tipi-ruolo
router.get('/api/tipi-ruolo', async (req, res) => {
  try {
    const records = await pb.collection('categorie').getFullList({
      filter: 'gruppo = "RUOLO"',
      sort: 'valore',
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;