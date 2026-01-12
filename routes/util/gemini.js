require("dotenv").config();
import { GoogleGenAI } from "@google/gnai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
const express = require('express');
const router = express.Router();

const ai = new GoogleGenAI({});

async function verifyAddress(via, civico, cap, comune, provincia, paese) {

  const prompt = `
    Devi verificare l'indirizzo con i seguenti dati disponibili:
    **Via:** ${via} - **Civico:** ${civico} - **CAP:** ${cap} - **Comune:** ${comune} - **Provincia:** ${provincia} - **Paese:** ${paese}.
    
    ---

    ## **REGOLE DI VERIFICA**

    ### **1. Dati richiesti**
    * Sono obbligatori e ti permettono di fare comunque una geoverifica: il Paese e almeno uno tra Cap, Comune, Provincia.
    * In caso contrario → Segnala errore bloccante.

    ### **2. Paese**

    * Il Paese deve essere in formato **ISO2**.
    * In caso contrario → Segnala errore bloccante.

    ### **3. Provincia**

    * La Provincia deve essere indicata **per esteso** (non sigle).
    * In caso contrario → Segnala errore bloccante.

    ### **4. CAP - Comune - Provincia - Paese**

    * Devono essere **geograficamente coerenti tra loro** e privi di refusi.
    * Se incoerenti o errati → Segnala errore bloccante.

    ---

    ## **5. Via (Regola fondamentale - SOLO controllo refusi, MAI geoverifica)**

    La Via **NON deve mai essere verificata geograficamente** rispetto a CAP, Comune, Provincia o Paese.
    Google Maps **non deve essere usato per verificare se la Via esiste in quel Comune** o se è geograficamente corretta.

    Puoi fare **solo** il controllo di **refusi**.

    ---

    ### **A. Controllo refusi (unico controllo ammesso)**

    Controlla la Via **solo per individuare errori di battitura evidenti**.
    Puoi usare Google Maps **solo** per confrontare il **nome della Via** e capire se:

    * esiste una Via **molto simile** (nome quasi identico) → indica un possibile **refuso**
    * oppure il nome contiene **anomalie linguistiche**, caratteri errati, inversioni ovvie, errori ortografici chiari

    🚫 **Se Google Maps non trova la Via o non trova nulla di simile, NON è un errore.**
    Non devi dedurre che la Via non esiste.
    Non devi dare warning solo perché Google Maps non la riconosce.

    ---

    ### **B. Regole di esito per la Via**

    * Se la Via **non presenta refusi evidenti** → Segnala successo
    * Se la Via presenta **refusi evidenti** (differenze anomale, errori di battitura, somiglianze forti con una via diversa trovata) → Segnala attenzione ma non errore bloccante

    ---

    ### ❗ DIVIETO ASSOLUTO

    🚫 **È vietato verificare la coerenza geografica della Via.**
    Quindi NON devi mai valutare o menzionare se la Via:

    * si trova nel Comune indicato
    * è compatibile con il CAP
    * è coerente con la Provincia o il Paese
    * compare o non compare in Google Maps come indirizzo reale

    Il controllo è **solo sul testo della Via**, mai sulla sua esistenza geografica.

    ---

    ## **6. Civico**

    * Il civico deve essere **numerico** oppure **vuoto**.
    * Se non è numerico → Segnala errore bloccante.

    🚫 È vietato verificare la coerenza geografica del civico.
    Puoi solo controllare se è numerico/valido come formato.

    ---

    Comunica chiaramente l'esito della tua verifica, e motiva la risposta specialmente in caso di errori o punti di attenzione.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  return response.text;

}

const verificationResultSchema = z.object({
  esito: z.enum(["error", "warning", "success"]).describe("L'esito della verifica: error, warning o success."),
  title: z.string().describe("Una brevissima frase che esprime l'esito per l'utente."),
  descr: z.string().describe("Spiegazione di errori o warnings, o la comunicazione del successo."),
});

async function parseVerificationResult(verificationText) {
  const prompt = `
    Analizza il seguente report di verifica indirizzo.
    Determina l'esito finale basandoti su queste regole:
    - "error": se nel testo sono menzionati errori bloccanti, dati mancanti obbligatori, incoerenze geografiche o formato errato.
    - "warning": se nel testo sono menzionati refusi evidenti, correzioni suggerite o punti di attenzione non bloccanti.
    - "success": se l'indirizzo è verificato con successo senza errori o warning significativi.

    Estrai un titolo breve e una descrizione chiara.

    Report da analizzare:
    """
    ${verificationText}
    """
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(verificationResultSchema),
    },
  });

  return verificationResultSchema.parse(JSON.parse(response.text));
}

router.post('/util/gemini/verify-address', async (req, res) => {
  try {
    const { via, civico, cap, comune, provincia, paese } = req.body;
    const verificationText = await verifyAddress(via, civico, cap, comune, provincia, paese);
    const result = await parseVerificationResult(verificationText);
    res.json(result);
  } catch (error) {
    console.error("Errore API Gemini:", error);
    res.status(500).json({ esito: "error", title: "Errore durante la verifica", descr: error.message });
  }
});

module.exports = router;