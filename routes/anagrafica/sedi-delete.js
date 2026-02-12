const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

router.post('/anagrafica/gestione-sedi/delete', async (req, res) => {
  const { id, confirm_prompt } = req.body;

  if (confirm_prompt !== 'elimina') {
    return res.status(400).send("Errore: Verifica intenzione fallita.");
  }

  try {
    await pb.collection('sedi').delete(id);
    res.redirect('/anagrafica/gestione-sedi');
  } catch (err) {
    return res.status(500).send("Errore eliminazione: " + err.message);
  }
});

module.exports = router;
