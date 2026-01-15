const express = require('express');
const router = express.Router();

// GET /anagrafica/gestione-sedi (Pagina EJS)
router.get('/anagrafica/gestione-sedi', (req, res) => {
  if (!req.query.societa_id) {
    return res.status(400).send("Errore: È necessario specificare una società per gestire le sedi.");
  }
  res.render('anagrafica/gestione-sedi');
});

module.exports = router;
