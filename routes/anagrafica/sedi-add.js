const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/add', async (req, res) => {
  let { societa_id, tipo_sede_id, via, numero_civico, cap, comune, provincia, paese, force_legal_seat, old_sede_action, new_type_for_old_sede } = req.body;

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
        const societa = await pb.collection('societa').getOne(societa_id);
        if (societa.sede_legale && force_legal_seat !== 'true') {
            return res.status(409).json({
                conflict: true,
                message: "Esiste già una Sede Legale registrata. Proseguendo, la vecchia sede legale perderà il suo stato attuale.",
                old_sede_legale_id: societa.sede_legale
            });
        }
    }

    // --- MAIN EXECUTION ---
    const indirizzoData = { via, numero_civico, cap, comune, provincia, paese };
    const indirizzoRecord = await pb.collection('indirizzi').create(indirizzoData);

    if (isNowLegal) {
      // Handle old legal seat if confirmation was given
      if (force_legal_seat === 'true') {
          const societa = await pb.collection('societa').getOne(societa_id);
          const oldIndirizzoId = societa.sede_legale;
          if (oldIndirizzoId) {
              if (old_sede_action === 'reclassify' && new_type_for_old_sede) {
                  // Create a new 'sedi' record for the old legal seat address
                  await pb.collection('sedi').create({
                      societa: societa_id,
                      indirizzo: oldIndirizzoId,
                      categorie: [new_type_for_old_sede]
                  });
              }
          }
      }
      // Set the new legal seat
      await pb.collection('societa').update(societa_id, { 'sede_legale': indirizzoRecord.id });
      res.json({ success: true, message: "Sede Legale inserita con successo." });
    } else {
      // It's a standard seat
      const sedeData = {
        societa: societa_id,
        indirizzo: indirizzoRecord.id,
        categorie: [tipo_sede_id]
      };
      await pb.collection('sedi').create(sedeData);
      res.json({ success: true, message: "Sede inserita con successo." });
    }
  } catch (err) {
    if (err.response && err.response.data) {
        const details = Object.values(err.response.data).map(v => v.message).join('. ');
        return res.status(400).json({ error: `Errore validazione: ${details}` });
    }
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;
