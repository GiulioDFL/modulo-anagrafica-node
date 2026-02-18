const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/edit', async (req, res) => {
  let { id, indirizzo_id, societa_id, tipo_sede_id, is_legal_original, via, numero_civico, cap, comune, provincia, paese, force_legal_seat, old_sede_action, new_type_for_old_sede } = req.body;

  if (!id || !societa_id || !tipo_sede_id) {
    return res.status(400).json({ error: "ID Sede, Società e Tipo Sede sono obbligatori." });
  }

  const wasLegal = is_legal_original === 'true';

  try {
    const pb = await getPb();
    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"');
    const isNowLegal = tipo_sede_id === catSedeLegale.id;

    // --- CONFLICT CHECK ---
    if (isNowLegal && !wasLegal) { // Only check when transitioning TO legal
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
    // 1. Update the address record itself. This is always done.
    const toTitleCase = (str) => (str || '').trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

    const indirizzoData = { 
      via: toTitleCase(via), 
      numero_civico: (numero_civico || '').trim().toUpperCase(), 
      cap: (cap || '').trim(), 
      comune: toTitleCase(comune), 
      provincia: (provincia || '').trim().toUpperCase(), 
      paese: (paese || '').trim().toUpperCase()
    };
    // L'ID dell'indirizzo è `id` se era legale, altrimenti `indirizzo_id`
    const currentIndirizzoId = wasLegal ? id : indirizzo_id;
    await pb.collection('indirizzi').update(currentIndirizzoId, indirizzoData);

    // 2. Gestisci le transizioni di stato
    if (wasLegal && isNowLegal) {
      // CASO 1: Legale -> Legale (solo modifica indirizzo, già fatta)
      // Nessuna operazione aggiuntiva richiesta
    } else if (!wasLegal && !isNowLegal) {
      // CASO 2: Operativa -> Operativa (modifica categoria sede)
      await pb.collection('sedi').update(id, { categorie: [tipo_sede_id] });
    } else if (!wasLegal && isNowLegal) {
      // CASO 3: Operativa -> Legale.
      // First, handle the *old* legal seat if there was a conflict.
      if (force_legal_seat === 'true') {
          const societa = await pb.collection('societa').getOne(societa_id);
          const oldIndirizzoId = societa.sede_legale;
          if (oldIndirizzoId) {
              if (old_sede_action === 'reclassify' && new_type_for_old_sede) {
                  await pb.collection('sedi').create({
                      societa: societa_id,
                      indirizzo: oldIndirizzoId,
                      categorie: [new_type_for_old_sede]
                  });
              }
          }
      }
      // Now, perform the promotion.
      // Update the societa to point to the new legal seat address.
      await pb.collection('societa').update(societa_id, { 'sede_legale': currentIndirizzoId });
      // Delete the original 'sedi' record, as it's now represented in 'societa'.
      await pb.collection('sedi').delete(id);
    } else if (wasLegal && !isNowLegal) {
      // CASO 4: Legale -> Operativa
      // Rimuovi il riferimento di sede legale dalla società
      await pb.collection('societa').update(societa_id, { 'sede_legale': null });
      // Crea un nuovo record in 'sedi'
      await pb.collection('sedi').create({
        societa: societa_id,
        indirizzo: currentIndirizzoId,
        categorie: [tipo_sede_id]
      });
    }

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
