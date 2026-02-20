const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

router.post('/anagrafica/gestione-sedi/edit', async (req, res) => {
  let { id, indirizzo_id, societa_id, tipo_sede_id, via, numero_civico, cap, comune, provincia, paese, contatti_json, funzioni_ids } = req.body;

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
    const oldContacts = currentSede.contatti || [];

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

    // Gestione Categorie: Unisce Tipo Sede (obbligatorio) con Funzioni (opzionali)
    const funzioni = Array.isArray(funzioni_ids) ? funzioni_ids : (funzioni_ids ? [funzioni_ids] : []);
    const categorie = [tipo_sede_id, ...funzioni];

    // Aggiorna la categoria della sede
    const updatedSedeData = { categorie: [...new Set(categorie)], contatti: [...new Set(listaContatti)] };
    await pb.collection('sedi').update(id, updatedSedeData);

    // Elimina i contatti che sono stati rimossi dalla sede
    const removedContacts = oldContacts.filter(cid => !updatedSedeData.contatti.includes(cid));
    for (const cid of removedContacts) {
        try { await pb.collection('contatti').delete(cid); } 
        catch (e) { console.warn(`Impossibile eliminare contatto orfano ${cid}:`, e.message); }
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
