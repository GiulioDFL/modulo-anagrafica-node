const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

router.get('/api/tipi-ufficio', async (req, res) => {
  try {
    const records = await pb.collection('categorie').getFullList({
      filter: 'gruppo = "UFFICIO"',
      sort: 'valore',
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;