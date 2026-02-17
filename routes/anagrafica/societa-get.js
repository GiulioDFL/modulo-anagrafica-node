const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// GET /api/anagrafica/societa (API Dati JSON)
router.get('/api/anagrafica/societa', async (req, res) => {
  try {
    const pb = await getPb();
    const { id, ragione_sociale, partita_iva, codice_fiscale, codice_destinatario, categoria, contatto } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    // Se viene fornito un ID, ha la priorità e cerchiamo solo quello.
    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else {
      const filters = [];
      if (ragione_sociale) filters.push(`ragione_sociale ~ "${escape(ragione_sociale)}"`);
      if (partita_iva) filters.push(`partita_iva ~ "${escape(partita_iva)}"`);
      if (codice_fiscale) filters.push(`codice_fiscale ~ "${escape(codice_fiscale)}"`);
      if (codice_destinatario) filters.push(`codice_destinatario ~ "${escape(codice_destinatario)}"`);
      if (categoria) filters.push(`categorie.valore ?~ "${escape(categoria)}"`);
      if (contatto) filters.push(`contatti.valore ?~ "${escape(contatto)}"`);

      filterString = filters.join(' && ');
    }
    // Recupero dati dalla collection 'societa'
    // getFullList recupera tutti i record corrispondenti (senza paginazione di default)
    const records = await pb.collection('societa').getFullList({
      filter: filterString,
      sort: '-created',
      expand: 'categorie,contatti',
    });

    // Restituisce i dati in formato JSON
    res.json(records);

  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;
