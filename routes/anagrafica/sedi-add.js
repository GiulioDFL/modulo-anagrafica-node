const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/add', async (req, res) => {
  let { societa_id, tipo_sede_id, via, numero_civico, cap, comune, provincia, paese } = req.body;

  // Validazione base
  if (!societa_id || !tipo_sede_id || !paese) {
    return res.status(400).json({ error: "Società, Tipo Sede e Paese sono obbligatori." });
  }

  // Formattazione
  const toTitleCase = (str) => (str || '').trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  via = toTitleCase(via);
  numero_civico = (numero_civico || '').trim().toUpperCase();
  cap = (cap || '').trim();
  comune = toTitleCase(comune);
  provincia = (provincia || '').trim().toUpperCase();
  paese = (paese || '').trim().toUpperCase();

  try {
    const pb = await getPb();
    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"');
    const isNowLegal = tipo_sede_id === catSedeLegale.id;

    // --- CONFLICT CHECK ---
    if (isNowLegal) {
      // Verifica se esiste già una sede legale nella tabella sedi
      const existingLegal = await pb.collection('sedi').getFirstListItem(`societa="${societa_id}" && categorie.id ?= "${catSedeLegale.id}"`).catch(() => null);
      
      if (existingLegal) {
        return res.status(400).json({
          error: "Esiste già una Sede Legale registrata per questa società. È necessario declassare o eliminare la sede esistente prima di poterne impostare una nuova."
        });
      }
    }

    // --- MAIN EXECUTION ---
    const indirizzoData = { via, numero_civico, cap, comune, provincia, paese };
    const indirizzoRecord = await pb.collection('indirizzi').create(indirizzoData);

    // Creazione record Sede (unificato per legale e operativa)
    const sedeData = { societa: societa_id, indirizzo: indirizzoRecord.id, categorie: [tipo_sede_id] };
    await pb.collection('sedi').create(sedeData);
    
    res.json({ success: true, message: "Sede inserita con successo." });
  } catch (err) {
    if (err.response && err.response.data) {
        const details = Object.values(err.response.data).map(v => v.message).join('. ');
        return res.status(400).json({ error: `Errore validazione: ${details}` });
    }
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;
