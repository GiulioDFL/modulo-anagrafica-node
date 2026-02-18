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
  via = (via || '').trim();
  numero_civico = (numero_civico || '').trim();
  cap = (cap || '').trim();
  comune = (comune || '').trim().toUpperCase();
  provincia = (provincia || '').trim().toUpperCase();
  paese = (paese || '').trim().toUpperCase();

  try {
    const pb = await getPb();
    const indirizzoData = { via, numero_civico, cap, comune, provincia, paese };
    const indirizzoRecord = await pb.collection('indirizzi').create(indirizzoData);

    const catSedeLegale = await pb.collection('categorie').getFirstListItem('gruppo="SEDE" && chiave="LEG"');
    const isNowLegal = tipo_sede_id === catSedeLegale.id;

    if (isNowLegal) {
      // È una Sede Legale: aggiorno la società
      await pb.collection('societa').update(societa_id, {
        'sede_legale': indirizzoRecord.id
      });
      res.json({ success: true, message: "Sede Legale inserita con successo." });

    } else {
      // È una sede standard: creo il record in 'sedi'
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
