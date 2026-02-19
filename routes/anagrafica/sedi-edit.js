const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/edit', async (req, res) => {
  let { id, indirizzo_id, societa_id, tipo_sede_id, via, numero_civico, cap, comune, provincia, paese } = req.body;

  if (!id || !societa_id || !tipo_sede_id) {
    return res.status(400).json({ error: "ID Sede, Società e Tipo Sede sono obbligatori." });
  }

  try {
    const pb = await getPb();
    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"');
    const isNowLegal = tipo_sede_id === catSedeLegale.id;

    // Recupera lo stato attuale della sede
    const currentSede = await pb.collection('sedi').getOne(id, { expand: 'categorie' });
    const wasLegal = currentSede.expand && currentSede.expand.categorie && currentSede.expand.categorie.some(c => c.id === catSedeLegale.id);

    // --- CONFLICT CHECK ---
    if (isNowLegal && !wasLegal) {
        // Cerca altre sedi legali per la stessa società
        const otherLegalSeats = await pb.collection('sedi').getFullList({
            filter: `societa = "${societa_id}" && categorie.id ?= "${catSedeLegale.id}" && id != "${id}"`
        });

        if (otherLegalSeats.length > 0) {
            return res.status(400).json({
                error: "Esiste già una Sede Legale registrata per questa società. È necessario declassare o eliminare la sede esistente prima di poterne impostare una nuova."
            });
        }
    }

    // --- MAIN EXECUTION ---
    const toTitleCase = (str) => (str || '').trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    const indirizzoData = { 
      via: toTitleCase(via), 
      numero_civico: (numero_civico || '').trim().toUpperCase(), 
      cap: (cap || '').trim(), 
      comune: toTitleCase(comune), 
      provincia: (provincia || '').trim().toUpperCase(), 
      paese: (paese || '').trim().toUpperCase()
    };
    
    // Aggiorna l'indirizzo collegato
    const currentIndirizzoId = currentSede.indirizzo;
    if (currentIndirizzoId) {
        await pb.collection('indirizzi').update(currentIndirizzoId, indirizzoData);
    }

    // Aggiorna la categoria della sede
    await pb.collection('sedi').update(id, { categorie: [tipo_sede_id] });

    res.json({ success: true, message: "Sede aggiornata con successo." });
  } catch (err) {
    if (err.response && err.response.data) {
        const details = Object.values(err.response.data).map(v => v.message).join('. ');
        return res.status(400).json({ error: `Errore validazione: ${details}` });
    }
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;
