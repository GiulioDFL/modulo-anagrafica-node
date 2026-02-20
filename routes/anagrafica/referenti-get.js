const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// GET /api/anagrafica/referenti
router.get('/api/anagrafica/referenti', async (req, res) => {
  try {
    const pb = await getPb();
    const { id, societa_id, sede_id, ufficio_id, search, ruoli } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    let filterString = '';

    if (id) {
      filterString = `id = "${escape(id)}"`;
    } else {
      const filters = [];

      if (societa_id) filters.push(`societa = "${escape(societa_id)}"`);
      if (sede_id) filters.push(`sede = "${escape(sede_id)}"`);
      if (ufficio_id) filters.push(`ufficio = "${escape(ufficio_id)}"`);

      const ruoliIds = ruoli ? (Array.isArray(ruoli) ? ruoli : [ruoli].filter(Boolean)) : [];
      if (ruoliIds.length > 0) {
        // Filtra per le categorie richieste (Ruoli)
        const roleFilters = ruoliIds.map(rid => `categorie.id ?= "${escape(rid)}"`);
        filters.push(`(${roleFilters.join(' || ')})`);
      }

      if (search) {
        // Logica di ricerca "DataTable.js style" su più campi
        const searchableFields = [
          'persona.nome',
          'persona.cognome',
          'persona.codice_fiscale',
          'categorie.valore',
          'contatti.valore',
          'contatti.tipo'
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
            const positiveConditions = searchableFields.map(field => {
              const operator = (field.startsWith('categorie.') || field.startsWith('contatti.')) ? '?~' : '~';
              return `${field} ${operator} "${escapedWord}"`;
            });
            searchFilters.push(`(${positiveConditions.join(' || ')})`);
          }
        });

        if (searchFilters.length > 0) {
          filters.push(`(${searchFilters.join(' && ')})`);
        }
      }

      filterString = filters.join(' && ');
    }

    const records = await pb.collection('referenti').getFullList({
      filter: filterString,
      sort: '-created',
      expand: 'persona,categorie,contatti,societa,sede,sede.indirizzo,sede.categorie,ufficio,ufficio.categorie',
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;