const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// GET /api/anagrafica/persone-fisiche
router.get('/api/anagrafica/persone-fisiche', async (req, res) => {
  try {
    const { id, search } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else if (search) {
      // Logica di ricerca "DataTable.js style" su più campi
      const searchableFields = [
        'nome',
        'cognome',
        'codice_fiscale',
        'categorie.valore',
        'contatti.valore'
      ];

      const terms = search.trim().split(/\s+/).filter(Boolean);
      const mainFilters = [];

      terms.forEach(term => {
        const isNegative = term.startsWith('!');
        const word = isNegative ? term.substring(1) : term;

        if (!word) return;

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

    const records = await pb.collection('persone_fisiche').getFullList({
      filter: filterString,
      sort: '-created',
      expand: 'categorie,contatti',
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;