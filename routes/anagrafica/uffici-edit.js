const express = require('express');
const router = express.Router();
const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione client PocketBase
const pb = new PocketBase(process.env.POCKET_BASE_URI);

// POST /anagrafica/gestione-uffici/edit
router.post('/anagrafica/gestione-uffici/edit', async (req, res) => {
  let { id, cva_tipo_ufficio_id, contatti_json } = req.body;

  if (!id) return res.status(400).json({ error: "ID ufficio mancante." });
  
  // Gestione array per multi-tag (categorie)
  const categorie = Array.isArray(cva_tipo_ufficio_id) ? cva_tipo_ufficio_id : (cva_tipo_ufficio_id ? [cva_tipo_ufficio_id] : []);

  if (categorie.length === 0) {
    return res.status(400).json({ error: "Almeno un Tipo Ufficio è obbligatorio." });
  }

  try {
    // Recupera lo stato attuale per gestire i contatti orfani
    const currentUfficio = await pb.collection('uffici').getOne(id);
    const oldContacts = currentUfficio.contatti || [];

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

    const data = {
      categorie: categorie,
      contatti: [...new Set(listaContatti)]
    };
    await pb.collection('uffici').update(id, data);

    // Elimina i contatti che sono stati rimossi dall'ufficio
    const removedContacts = oldContacts.filter(cid => !data.contatti.includes(cid));
    for (const cid of removedContacts) {
        try { await pb.collection('contatti').delete(cid); } 
        catch (e) { console.warn(`Impossibile eliminare contatto orfano ${cid}:`, e.message); }
    }

    res.json({ success: true, message: "Ufficio aggiornato con successo" });
  } catch (err) {
    res.status(500).json({ error: "Errore aggiornamento: " + err.message });
  }
});

module.exports = router;