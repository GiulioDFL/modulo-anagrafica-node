const express = require('express');
const router = express.Router();

// GET /anagrafica/gestione-referenti (Pagina EJS)
router.get('/anagrafica/gestione-referenti', (req, res) => {
  const { societa_id, sede_id, ufficio_id } = req.query;
  if (!societa_id) {
    return res.status(400).send("Errore: È necessario specificare una società per gestire i referenti.");
  }
  res.render('anagrafica/gestione-referenti', { societa_id, sede_id, ufficio_id });
});

module.exports = router;