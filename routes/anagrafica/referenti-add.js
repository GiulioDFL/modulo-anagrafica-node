const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-referenti/add
router.post('/anagrafica/gestione-referenti/add', async (req, res) => {
  let { societa_id, sede_id, ufficio_id, persona_id, cva_tipo_ruolo_id, nome, cognome } = req.body;

  const ruoli = Array.isArray(cva_tipo_ruolo_id) ? cva_tipo_ruolo_id : (cva_tipo_ruolo_id ? [cva_tipo_ruolo_id] : []);

  if (!societa_id || ruoli.length === 0) {
    return res.status(400).json({ error: "Società e almeno un Ruolo sono obbligatori." });
  }

  try {
    const pb = await getPb();
    // 1. Gestione Persona Fisica
    // Se non viene passato un ID persona, verifichiamo se dobbiamo crearne una nuova
    if (!persona_id) {
      if (nome && cognome) {
        const personaData = {
          nome: nome.trim(),
          cognome: cognome.trim()
        };
        const personaRecord = await pb.collection('persone_fisiche').create(personaData);
        persona_id = personaRecord.id;
      } else {
        return res.status(400).json({ error: "È necessario specificare una persona esistente o Nome e Cognome." });
      }
    }

    // 2. Creazione Referente
    // La collection 'referenti' ha campi relazione diretti per societa, sede, ufficio, persona e categorie (ruoli)
    const referenteData = {
      societa: societa_id,
      sede: sede_id || null,
      ufficio: ufficio_id || null,
      persona: persona_id,
      categorie: ruoli
    };

    const record = await pb.collection('referenti').create(referenteData);

    res.json({ success: true, message: "Referente inserito con successo", id: record.id });

  } catch (err) {
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;