const express = require('express');
const router = express.Router();
const db = require('../../database/definition/init');

// POST /anagrafica/gestione-uffici/delete
router.post('/anagrafica/gestione-uffici/delete', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID ufficio mancante." });
  }

  const sql = `DELETE FROM uffici WHERE id = ?`;

  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: "Errore durante l'eliminazione dell'ufficio (potrebbe essere referenziato altrove): " + err.message });
    }
    res.json({ success: true, message: "Ufficio eliminato con successo." });
  });
});

module.exports = router;