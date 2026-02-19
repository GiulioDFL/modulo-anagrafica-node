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

    // Recupera la categoria 'Sede Legale' per identificare le sedi legali nei risultati
    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"').catch(() => null);

    // --- GESTIONE DETTAGLIO SINGOLA SEDE ---
    if (id) {
      // Recupera direttamente dalla collection sedi
      const record = await pb.collection('sedi').getOne(id, { expand: 'indirizzo,categorie,contatti,societa' });
      
      // Determina se è legale basandosi sulla categoria
      const isLegal = catSedeLegale && record.expand && record.expand.categorie && record.expand.categorie.some(c => c.id === catSedeLegale.id);
      
      const result = {
        ...record,
        is_legal: !!isLegal
      };
      
      return res.json([result]);
    }

    // --- GESTIONE LISTA SEDI ---
    const filters = [];
    
    if (societa_id) {
      filters.push(`societa = "${escape(societa_id)}"`);
    }

    const tipiSedeIds = tipi_sede ? (Array.isArray(tipi_sede) ? tipi_sede : [tipi_sede].filter(Boolean)) : [];
    if (tipiSedeIds.length > 0) {
      // Filtra per le categorie richieste
      const typeFilters = tipiSedeIds.map(tid => `categorie.id ?= "${escape(tid)}"`);
      filters.push(`(${typeFilters.join(' || ')})`);
    }

    if (search) {
      const searchTerms = search.replace(/[^\w\sàèìòùÀÈÌÒÙ\-]/gi, ' ').trim().split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        const searchFields = ['indirizzo.via', 'indirizzo.numero_civico', 'indirizzo.comune', 'indirizzo.cap', 'categorie.valore', 'contatti.valore'];
        const termFilters = searchTerms.map(term => `(${searchFields.map(f => `${f} ~ "${escape(term)}"`).join(' || ')})`);
        filters.push(`(${termFilters.join(' && ')})`);
      }
    }

    const records = await pb.collection('sedi').getFullList({
      filter: filters.join(' && '),
      expand: 'indirizzo,categorie,contatti,societa',
      sort: '-created',
    });

    // Mappa i risultati per aggiungere il flag is_legal
    const results = records.map(s => {
      const isLegal = catSedeLegale && s.expand && s.expand.categorie && s.expand.categorie.some(c => c.id === catSedeLegale.id);
      return {
        ...s,
        is_legal: !!isLegal
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;
