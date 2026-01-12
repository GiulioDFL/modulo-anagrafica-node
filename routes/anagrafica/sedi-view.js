const express = require('express');
const router = express.Router();

// GET /anagrafica/gestione-sedi (Pagina EJS)
router.get('/anagrafica/gestione-sedi', (req, res) => {
  res.render('anagrafica/gestione-sedi');
});

module.exports = router;
