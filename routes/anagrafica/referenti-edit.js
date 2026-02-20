const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-referenti/edit
router.post('/anagrafica/gestione-referenti/edit', async (req, res) => {
  let { id, persona_id, cva_tipo_ruolo_id, nome, cognome, contatti_json } = req.body;

  const ruoli = Array.isArray(cva_tipo_ruolo_id) ? cva_tipo_ruolo_id : (cva_tipo_ruolo_id ? [cva_tipo_ruolo_id] : []);

  if (!id) return res.status(400).json({ error: "ID referente mancante." });
  if (!persona_id || ruoli.length === 0) {
    return res.status(400).json({ error: "Persona e almeno un Ruolo sono obbligatori." });
  }

  // Formattazione
  nome = (nome || '').trim();
  cognome = (cognome || '').trim();

  try {
    const pb = await getPb();
    
    // Recupera lo stato attuale per gestire i contatti orfani
    const currentReferente = await pb.collection('referenti').getOne(id);
    const oldContacts = currentReferente.contatti || [];

    // 1. Aggiorna Dati Persona Fisica
    const personaData = {
      nome,
      cognome
    };
    await pb.collection('persone_fisiche').update(persona_id, personaData);

    // Gestione Contatti
    let listaContatti = [];
    if (contatti_json) {
        try {
            const contactsInput = JSON.parse(contatti_json);
            for (const c of contactsInput) {
                let contactId = c.id;
                const contactData = { tipo: c.tipo, valore: c.valore };
                
                if (contactId) {
                    try { await pb.collection('contatti').update(contactId, contactData); } 
                    catch (e) { try { const ex = await pb.collection('contatti').getFirstListItem(`valore="${c.valore}"`); contactId = ex.id; } catch (ex) {} }
                } else {
                    try { 
                        const newC = await pb.collection('contatti').create(contactData); 
                        contactId = newC.id; 
                    } catch (e) {
                        try { const ex = await pb.collection('contatti').getFirstListItem(`valore="${c.valore}"`); contactId = ex.id; } catch (ex) {}
                    }
                }
                if (contactId) listaContatti.push(contactId);
            }
        } catch (e) {
            console.error("Errore processamento contatti:", e);
        }
    }

    // 2. Aggiorna Ruoli (Categorie) nel Referente
    // In PocketBase, aggiornare un campo relazione sovrascrive la lista esistente con quella nuova
    const referenteData = {
      categorie: ruoli,
      contatti: [...new Set(listaContatti)]
    };
    await pb.collection('referenti').update(id, referenteData);

    // Elimina i contatti che sono stati rimossi dal referente
    const removedContacts = oldContacts.filter(cid => !referenteData.contatti.includes(cid));
    for (const cid of removedContacts) {
        try { await pb.collection('contatti').delete(cid); } 
        catch (e) { console.warn(`Impossibile eliminare contatto orfano ${cid}:`, e.message); }
    }

    res.json({ success: true, message: "Referente aggiornato con successo" });

  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;