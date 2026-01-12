const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

router.post('/anagrafica/gestione-sedi/delete', (req, res) => {
  const { id, confirm_prompt } = req.body;

  if (confirm_prompt !== 'elimina') {
    return res.status(400).send("Errore: Verifica intenzione fallita.");
  }

  db.run(`DELETE FROM sedi WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("Errore eliminazione: " + err.message);
    res.redirect('/anagrafica/gestione-sedi');
  });
});

module.exports = router;
