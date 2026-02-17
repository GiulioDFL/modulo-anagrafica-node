const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-uffici/add
router.post('/anagrafica/gestione-uffici/add', async (req, res) => {
  let { societa_id, sede_id, cva_tipo_ufficio_id } = req.body;

  // Validazione base
  if (!societa_id || !cva_tipo_ufficio_id) {
    return res.status(400).json({ error: "Società e Tipo Ufficio sono obbligatori." });
  }
  
  // Gestione array per categorie (ex cva_tipo_ufficio_id)
  const categorie = Array.isArray(cva_tipo_ufficio_id) ? cva_tipo_ufficio_id : (cva_tipo_ufficio_id ? [cva_tipo_ufficio_id] : []);

  try {
    const pb = await getPb();
    const data = {
      societa: societa_id,
      sede: sede_id || null,
      categorie: categorie
    };

    const record = await pb.collection('uffici').create(data);

    res.json({ success: true, message: "Ufficio inserito con successo", id: record.id });
  } catch (err) {
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;