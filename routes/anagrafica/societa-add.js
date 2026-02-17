const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-societa/add (Inserimento)
router.post('/anagrafica/gestione-societa/add', async (req, res) => {
  let { ragione_sociale, partita_iva, codice_fiscale, codice_destinatario, cva_settore_id, contatti, contatti_json } = req.body;

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

  // P.IVA: deve essere numerica di 11 cifre
  if (partita_iva && !/^\d{11}$/.test(partita_iva)) {
    errors.push("La Partita IVA deve essere composta da 11 cifre numeriche.");
  }

  // Codice Fiscale: alfanumerico, 11 (persone giuridiche) o 16 (fisiche) caratteri
  if (codice_fiscale && !/^[A-Z0-9]{11,16}$/.test(codice_fiscale)) {
    errors.push("Il Codice Fiscale deve essere alfanumerico (11 o 16 caratteri).");
  }

  // Codice Destinatario: 7 caratteri alfanumerici
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

    const record = await pb.collection('societa').create(data);
    res.json({ success: true, message: "Società inserita con successo", id: record.id });
  } catch (err) {
    // Gestione errori dettagliata da PocketBase (es. validazione campi)
    if (err.response && err.response.data) {
        const details = Object.entries(err.response.data)
            .map(([key, val]) => `${key}: ${val.message}`)
            .join(', ');
        return res.status(400).json({ error: `Errore validazione: ${details}` });
    }
    res.status(500).json({ error: "Errore inserimento: " + (err.message || err) });
  }
});

module.exports = router;
