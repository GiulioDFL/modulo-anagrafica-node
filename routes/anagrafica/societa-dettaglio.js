const express = require('express');
const router = express.Router();

// GET /anagrafica/dettaglio-societa/:id
router.get('/anagrafica/dettaglio-societa/:id', (req, res) => {
  res.render('anagrafica/dettaglio-societa', { id: req.params.id });
});

module.exports = router;