const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-referenti/delete
router.post('/anagrafica/gestione-referenti/delete', (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "ID referente mancante." });

  const sql = `DELETE FROM referenti WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: "Errore eliminazione referente: " + err.message });
    res.json({ success: true, message: "Referente eliminato con successo" });
  });
});

module.exports = router;