const express = require('express');
const router = express.Router();

router.get('/anagrafica/gestione-referenti/dettaglio', (req, res) => {
    const { id, societa_id, sede_id, ufficio_id } = req.query;
    res.render('anagrafica/referente-dettaglio', { 
        id, 
        societa_id, 
        sede_id, 
        ufficio_id 
    });
});

module.exports = router;