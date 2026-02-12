const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// GET /api/anagrafica/societa (API Dati JSON)
router.get('/api/anagrafica/societa', async (req, res) => {
  try {
    const { id, search } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    // Se viene fornito un ID, ha la priorità e cerchiamo solo quello.
    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else if (search) {
      // Logica di ricerca "DataTable.js style" su più campi
      const searchableFields = [
        'ragione_sociale',
        'partita_iva',
        'codice_fiscale',
        'codice_destinatario',
        'categorie.valore',
        'contatti.valore'
      ];

      const terms = search.trim().split(/\s+/).filter(Boolean); // Rimuove spazi extra e parole vuote
      const mainFilters = [];

      terms.forEach(term => {
        const isNegative = term.startsWith('!');
        const word = isNegative ? term.substring(1) : term;

        if (!word) return; // Salta se la parola è vuota (es. solo "!")

        const escapedWord = escape(word);

        if (isNegative) {
          // Deve NON contenere la parola in NESSUN campo
          const negativeConditions = searchableFields.map(field =>
            `${field} !~ "${escapedWord}"`
          );
          mainFilters.push(`(${negativeConditions.join(' && ')})`);
        } else {
          // Deve contenere la parola in ALMENO UN campo
          const positiveConditions = searchableFields.map(field =>
            `${field} ~ "${escapedWord}"`
          );
          mainFilters.push(`(${positiveConditions.join(' || ')})`);
        }
      });

      filterString = mainFilters.join(' && ');
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
