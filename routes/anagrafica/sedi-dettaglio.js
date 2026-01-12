const express = require('express');
const router = express.Router();

// GET /anagrafica/dettaglio-sede/:id
router.get('/anagrafica/dettaglio-sede/:id', (req, res) => {
  res.render('anagrafica/dettaglio-sede', { id: req.params.id });
});

module.exports = router;