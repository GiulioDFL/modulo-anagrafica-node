const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-societa/delete (Eliminazione)
router.post('/anagrafica/gestione-societa/delete', async (req, res) => {
  const { id, confirm_prompt } = req.body;

  if (confirm_prompt !== 'elimina') {
    return res.status(400).send("Errore: Verifica intenzione fallita. Devi digitare 'elimina' per confermare.");
  }

  try {
    await pb.collection('societa').delete(id);
    res.redirect('/anagrafica/gestione-societa');
  } catch (err) {
    return res.status(500).send("Errore eliminazione: " + err.message);
  }
});

module.exports = router;
