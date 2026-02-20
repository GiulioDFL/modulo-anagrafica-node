const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/delete', async (req, res) => {
  const { id, confirm_prompt } = req.body;

  if (confirm_prompt !== 'elimina') {
    return res.status(400).send("Errore: Verifica intenzione fallita. Devi digitare 'elimina' per confermare.");
  }

  try {
    const pb = await getPb();
    await pb.collection('sedi').delete(id);
    res.json({ success: true });
  } catch (err) {
    return res.status(500).send("Errore eliminazione: " + err.message);
  }
});

module.exports = router;
