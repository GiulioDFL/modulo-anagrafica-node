const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// GET /api/anagrafica/sedi
router.get('/api/anagrafica/sedi', async (req, res) => {
  try {
    const pb = await getPb();
    const { id, societa_id, search, tipi_sede, is_legal } = req.query;

    // Helper per escape caratteri nelle stringhe di filtro
    const escape = (str) => (str || '').replace(/"/g, '\\"');

    // Recupera la categoria 'Sede Legale' una sola volta, gestendo il caso in cui non esista.
    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"').catch(() => null);

    // --- GESTIONE DETTAGLIO SINGOLA SEDE ---
    if (id) {
      if (is_legal === 'true') {
        if (!catSedeLegale) {
          return res.status(404).json({ error: "Impossibile trovare la categoria 'Sede Legale' nelle impostazioni. Impossibile caricare il dettaglio." });
        }
        // È una Sede Legale, l'ID è quello dell'indirizzo
        const indirizzo = await pb.collection('indirizzi').getOne(id);
        const societa = await pb.collection('societa').getFirstListItem(`sede_legale = "${id}"`);
        
        const fakeSede = {
          id: indirizzo.id, // L'ID è quello dell'indirizzo
          is_legal: true,
          societa: societa.id,
          indirizzo: indirizzo.id,
          expand: {
            indirizzo: indirizzo,
            societa: societa,
            categorie: [catSedeLegale]
          }
        };
        return res.json([fakeSede]);
      } else {
        // È una sede standard
        const record = await pb.collection('sedi').getOne(id, { expand: 'indirizzo,categorie,contatti,societa' });
        record.is_legal = false;
        return res.json([record]);
      }
    }

    // --- GESTIONE LISTA SEDI ---
    let allResults = [];
    const tipiSedeIds = tipi_sede ? (Array.isArray(tipi_sede) ? tipi_sede : [tipi_sede].filter(Boolean)) : [];
    
    const wantsLegal = catSedeLegale && (!tipi_sede || tipiSedeIds.length === 0 || tipiSedeIds.includes(catSedeLegale.id));
    const wantsOthers = !tipi_sede || tipiSedeIds.length === 0 || tipiSedeIds.some(tid => !catSedeLegale || tid !== catSedeLegale.id);

    const searchTerms = search ? search.replace(/[^\w\sàèìòùÀÈÌÒÙ\-]/gi, ' ').trim().split(/\s+/).filter(Boolean) : [];

    // 1. Recupera sedi standard (non legali)
    if (wantsOthers) {
      const filters = [];
      if (catSedeLegale) {
        filters.push(`categorie.id != "${catSedeLegale.id}"`);
      }
      if (societa_id) filters.push(`societa = "${escape(societa_id)}"`);
      
      const otherTipi = tipiSedeIds.filter(tid => !catSedeLegale || tid !== catSedeLegale.id);
      if (otherTipi.length > 0) {
        filters.push(`(${otherTipi.map(tid => `categorie.id = "${escape(tid)}"`).join(' || ')})`);
      }

      if (searchTerms.length > 0) {
        const searchFields = ['indirizzo.via', 'indirizzo.numero_civico', 'indirizzo.comune', 'indirizzo.cap', 'categorie.valore', 'contatti.valore'];
        const termFilters = searchTerms.map(term => `(${searchFields.map(f => `${f} ~ "${escape(term)}"`).join(' || ')})`);
        filters.push(`(${termFilters.join(' && ')})`);
      }

      const regularSedi = await pb.collection('sedi').getFullList({
        filter: filters.join(' && '),
        expand: 'indirizzo,categorie,contatti,societa',
      });
      allResults.push(...regularSedi.map(s => ({ ...s, is_legal: false })));
    }

    // 2. Recupera sedi legali
    if (wantsLegal) {
      const societaFilters = ['sede_legale != null'];
      if (societa_id) societaFilters.push(`id = "${escape(societa_id)}"`);

      if (searchTerms.length > 0) {
        const searchFields = ['sede_legale.via', 'sede_legale.numero_civico', 'sede_legale.comune', 'sede_legale.cap'];
        const termFilters = searchTerms.map(term => `(${searchFields.map(f => `${f} ~ "${escape(term)}"`).join(' || ')})`);
        societaFilters.push(`(${termFilters.join(' && ')})`);
      }

      const societaWithLegal = await pb.collection('societa').getFullList({
        filter: societaFilters.join(' && '),
        expand: 'sede_legale, contatti',
      });

      const legalSedi = societaWithLegal.map(soc => {
        if (!soc.expand || !soc.expand.sede_legale || !catSedeLegale) return null;
        return {
          id: soc.sede_legale, // L'ID è quello dell'indirizzo
          is_legal: true,
          collectionId: 'sedi', // Simula una sede per coerenza
          societa: soc.id,
          indirizzo: soc.sede_legale,
          expand: {
            indirizzo: soc.expand.sede_legale,
            societa: soc,
            categorie: [catSedeLegale],
            contatti: soc.expand.contatti || []
          }
        };
      }).filter(Boolean);
      allResults.push(...legalSedi);
    }

    // Ordina i risultati finali
    allResults.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json(allResults);
  } catch (error) {
    res.status(500).json({ error: "Errore interno del server: " + error.message });
  }
});

module.exports = router;
