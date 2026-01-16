const express = require('express');
const router = express.Router();

// GET /anagrafica/gestione-uffici (Pagina EJS)
router.get('/anagrafica/gestione-uffici', (req, res) => {
  const { societa_id, sede_id } = req.query;
  if (!societa_id) {
    return res.status(400).send("Errore: È necessario specificare una società per gestire gli uffici.");
  }
  res.render('anagrafica/gestione-uffici', { societa_id, sede_id });
});

// GET /anagrafica/ufficio/dettaglio (Pagina EJS)
router.get('/anagrafica/ufficio/dettaglio', (req, res) => {
  const { id, societa_id, sede_id } = req.query;
  if (!id) {
    return res.status(400).send("Errore: ID ufficio mancante.");
  }
  res.render('anagrafica/ufficio-dettaglio', { id, societa_id, sede_id });
});

module.exports = router;