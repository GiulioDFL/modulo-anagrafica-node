const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// GET /api/anagrafica/uffici
router.get('/api/anagrafica/uffici', async (req, res) => {
  try {
    const { id, societa_id, sede_id, search } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else {
      if (!societa_id) {
        return res.status(400).json({ error: "Parametro societa_id mancante." });
      }

      const filters = [`societa = "${escape(societa_id)}"`];

      if (sede_id) {
        filters.push(`sede = "${escape(sede_id)}"`);
      }

      if (search) {
        // Logica di ricerca "DataTable.js style" su più campi
        const searchableFields = [
          'categorie.valore',
          'contatti.valore'
        ];

        const terms = search.trim().split(/\s+/).filter(Boolean);
        const searchFilters = [];

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
            searchFilters.push(`(${negativeConditions.join(' && ')})`);
          } else {
            // Deve contenere la parola in ALMENO UN campo
            const positiveConditions = searchableFields.map(field =>
              `${field} ~ "${escapedWord}"`
            );
            searchFilters.push(`(${positiveConditions.join(' || ')})`);
          }
        });

        if (searchFilters.length > 0) {
          filters.push(`(${searchFilters.join(' && ')})`);
        }
      }

      filterString = filters.join(' && ');
    }

    const records = await pb.collection('uffici').getFullList({
      filter: filterString,
      sort: '-created',
      expand: 'categorie,contatti,sede,societa',
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;