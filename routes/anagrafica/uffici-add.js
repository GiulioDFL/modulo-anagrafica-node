const express = require('express');
const router = express.Router();
const getPb = require('../../pocketbase-client');

// POST /anagrafica/gestione-uffici/add
router.post('/anagrafica/gestione-uffici/add', async (req, res) => {
  let { societa_id, sede_id, cva_tipo_ufficio_id, contatti_json } = req.body;

  // Validazione base
  if (!societa_id || !cva_tipo_ufficio_id) {
    return res.status(400).json({ error: "Società e Tipo Ufficio sono obbligatori." });
  }
  
  // Gestione array per categorie (ex cva_tipo_ufficio_id)
  const categorie = Array.isArray(cva_tipo_ufficio_id) ? cva_tipo_ufficio_id : (cva_tipo_ufficio_id ? [cva_tipo_ufficio_id] : []);

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
      societa: societa_id,
      sede: sede_id || null,
      categorie: categorie,
      contatti: [...new Set(listaContatti)]
    };

    const record = await pb.collection('uffici').create(data);

    res.json({ success: true, message: "Ufficio inserito con successo", id: record.id });
  } catch (err) {
    res.status(500).json({ error: "Errore inserimento: " + err.message });
  }
});

module.exports = router;