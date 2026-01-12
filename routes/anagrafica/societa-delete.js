const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-societa/delete (Eliminazione)
router.post('/anagrafica/gestione-societa/delete', (req, res) => {
  const { id, confirm_prompt } = req.body;

  if (confirm_prompt !== 'elimina') {
    return res.status(400).send("Errore: Verifica intenzione fallita. Devi digitare 'elimina' per confermare.");
  }

  db.run(`DELETE FROM societa WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).send("Errore eliminazione: " + err.message);
    res.redirect('/anagrafica/gestione-societa');
  });
});

module.exports = router;
