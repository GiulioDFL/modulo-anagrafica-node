const express = require('express');
const router = express.Router();

// GET /anagrafica/gestione-societa (Pagina EJS)
router.get('/anagrafica/gestione-societa', (req, res) => {
    res.render('anagrafica/gestione-societa');
});

module.exports = router;