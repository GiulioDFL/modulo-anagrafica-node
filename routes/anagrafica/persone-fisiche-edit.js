const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-persone-fisiche/edit
router.post('/anagrafica/gestione-persone-fisiche/edit', async (req, res) => {
  let { id, nome, cognome, data_nascita, codice_fiscale, cva_tipo_competenza_id } = req.body;

  if (!id) return res.status(400).json({ error: "ID persona mancante." });

  // Formattazione
  nome = (nome || '').trim();
  cognome = (cognome || '').trim();
  codice_fiscale = (codice_fiscale || '').trim().toUpperCase();
  data_nascita = (data_nascita || '').trim();

  const competenze = Array.isArray(cva_tipo_competenza_id) ? cva_tipo_competenza_id : (cva_tipo_competenza_id ? [cva_tipo_competenza_id] : []);

  // Validazione
  if (!nome || !cognome) {
    return res.status(400).json({ error: "Nome e Cognome sono obbligatori." });
  }

  if (codice_fiscale && !/^[A-Z0-9]{16}$/.test(codice_fiscale)) {
    return res.status(400).json({ error: "Il Codice Fiscale deve essere di 16 caratteri alfanumerici." });
  }

  const data = {
    nome,
    cognome,
    data_nascita: data_nascita || null,
    codice_fiscale: codice_fiscale || null,
    categorie: competenze // Mappatura sul campo 'categorie' della collection persone_fisiche
  };

  try {
    const pb = await getPb();
    await pb.collection('persone_fisiche').update(id, data);
    res.json({ success: true, message: "Persona fisica aggiornata con successo" });
  } catch (err) {
    if (err.status === 400 && err.response?.data?.codice_fiscale) {
      return res.status(400).json({ error: "Esiste già una persona con questo Codice Fiscale." });
    }
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;
