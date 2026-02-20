const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-societa/edit (Modifica)
router.post('/anagrafica/gestione-societa/edit', async (req, res) => {
  let { id, ragione_sociale, partita_iva, codice_fiscale, codice_destinatario, cva_settore_id, contatti, contatti_json } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID società mancante." });
  }

  // 1. Formattazione e Pulizia Dati
  ragione_sociale = (ragione_sociale || '').trim().toUpperCase();
  partita_iva = (partita_iva || '').trim();
  codice_fiscale = (codice_fiscale || '').trim().toUpperCase();
  codice_destinatario = (codice_destinatario || '').trim().toUpperCase();

  // 2. Validazione Rigorosa
  const errors = [];

  if (!ragione_sociale) {
    errors.push("La Ragione Sociale è obbligatoria.");
  }

  if (partita_iva && !/^\d{11}$/.test(partita_iva)) {
    errors.push("La Partita IVA deve essere composta da 11 cifre numeriche.");
  }

  if (codice_fiscale && !/^[A-Z0-9]{11,16}$/.test(codice_fiscale)) {
    errors.push("Il Codice Fiscale deve essere alfanumerico (11 o 16 caratteri).");
  }

  if (codice_destinatario && !/^[A-Z0-9]{7}$/.test(codice_destinatario)) {
    errors.push("Il Codice Destinatario deve essere di 7 caratteri alfanumerici.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("\n") });
  }

  // Preparazione payload per PocketBase
  const settori = Array.isArray(cva_settore_id) ? cva_settore_id : (cva_settore_id ? [cva_settore_id] : []);

  const data = {
    ragione_sociale,
    partita_iva: partita_iva || null,
    codice_fiscale: codice_fiscale || null,
    codice_destinatario: codice_destinatario || null,
    categorie: settori, // Mappatura corretta sul campo 'categorie' di PocketBase
  };

  try {
    const pb = await getPb();
    
    // Recupera i contatti attuali per gestire le eliminazioni
    const currentSocieta = await pb.collection('societa').getOne(id);
    const oldContacts = currentSocieta.contatti || [];

    // Gestione Contatti: Processa il JSON ricevuto dal frontend
    let listaContatti = [];
    if (contatti_json) {
        try {
            const contactsInput = JSON.parse(contatti_json);
            for (const c of contactsInput) {
                let contactId = c.id;
                const contactData = { tipo: c.tipo, valore: c.valore };
                
                if (contactId) {
                    // Contatto esistente: prova aggiornamento
                    try { await pb.collection('contatti').update(contactId, contactData); } 
                    catch (e) { 
                        // Se fallisce (es. valore duplicato), cerca se esiste già quel valore
                        try { const ex = await pb.collection('contatti').getFirstListItem(`valore="${c.valore}"`); contactId = ex.id; } catch (ex) {}
                    }
                } else {
                    // Nuovo contatto: crea
                    try { 
                        const newC = await pb.collection('contatti').create(contactData); 
                        contactId = newC.id; 
                    } catch (e) {
                        // Se fallisce creazione (es. esiste già), usa esistente
                        try { const ex = await pb.collection('contatti').getFirstListItem(`valore="${c.valore}"`); contactId = ex.id; } catch (ex) {}
                    }
                }
                if (contactId) listaContatti.push(contactId);
            }
        } catch (e) {
            console.error("Errore processamento contatti:", e);
        }
    } else {
        listaContatti = Array.isArray(contatti) ? contatti : (contatti ? [contatti] : []);
    }
    data.contatti = [...new Set(listaContatti)]; // Rimuove duplicati

    await pb.collection('societa').update(id, data);
    
    // Elimina i contatti che sono stati rimossi dalla società
    const removedContacts = oldContacts.filter(cid => !data.contatti.includes(cid));
    for (const cid of removedContacts) {
        try { await pb.collection('contatti').delete(cid); } 
        catch (e) { console.warn(`Impossibile eliminare contatto orfano ${cid}:`, e.message); }
    }

    res.json({ success: true, message: "Società aggiornata con successo" });
  } catch (err) {
    // Gestione errori dettagliata da PocketBase (es. validazione campi)
    if (err.response && err.response.data) {
        const details = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${val.message}`)
            .join(', ');
        return res.status(400).json({ error: `Errore validazione: ${details}` });
    }
    return res.status(500).json({ error: "Errore aggiornamento: " + (err.message || err) });
  }
});

module.exports = router;
