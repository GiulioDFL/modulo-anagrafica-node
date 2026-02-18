const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// GET /api/anagrafica/sedi
router.get('/api/anagrafica/sedi', async (req, res) => {
  try {
    const pb = await getPb();
    const { id, societa_id, search, tipi_sede } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else {
      // Se non viene richiesto un ID specifico (dettaglio), societa_id è obbligatorio per la lista
      if (!societa_id) {
        return res.status(400).json({ error: "Parametro societa_id mancante." });
      }

      const filters = [`societa = "${escape(societa_id)}"`];

      if (search) {
        // Logica di ricerca "DataTable.js style" su campi indirizzo
        const searchableFields = [
          'indirizzo.via',
          'indirizzo.numero_civico',
          'indirizzo.comune',
          'indirizzo.cap',
          'indirizzo.provincia',
          'indirizzo.paese',
          'categorie.valore',
          'contatti.valore',
          'contatti.tipo'
        ];

        // Sanificazione: sostituisce caratteri speciali (virgole, parentesi, ecc.) con spazi
        // Mantiene caratteri alfanumerici, spazi, accenti e trattini.
        const terms = search.replace(/[^\w\sàèìòùÀÈÌÒÙ\-]/gi, ' ').trim().split(/\s+/).filter(Boolean);
        const searchFilters = [];

        terms.forEach(term => {
          const isNegative = term.startsWith('!');
          const word = isNegative ? term.substring(1) : term;
          if (!word) return;
          const escapedWord = escape(word);

          if (isNegative) {
            const negativeConditions = searchableFields.map(f => `${f} !~ "${escapedWord}"`);
            searchFilters.push(`(${negativeConditions.join(' && ')})`);
          } else {
            const positiveConditions = searchableFields.map(f => {
              const operator = (f.startsWith('categorie.') || f.startsWith('contatti.')) ? '?~' : '~';
              return `${f} ${operator} "${escapedWord}"`;
            });
            searchFilters.push(`(${positiveConditions.join(' || ')})`);
          }
        });

        if (searchFilters.length > 0) {
          filters.push(`(${searchFilters.join(' && ')})`);
        }
      }

      // Filtro per tipi di sede (da select multi-opzione)
      if (tipi_sede) {
        const tipiSedeIds = Array.isArray(tipi_sede) ? tipi_sede : [tipi_sede].filter(Boolean);
        if (tipiSedeIds.length > 0) {
            const tipiFilter = tipiSedeIds.map(tid => `categorie.id = "${escape(tid)}"`).join(' || ');
            filters.push(`(${tipiFilter})`);
        }
      }
      
      filterString = filters.join(' && ');
    }

    const records = await pb.collection('sedi').getFullList({
      filter: filterString,
      sort: '-created',
      expand: 'indirizzo,categorie,contatti,societa',
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;
