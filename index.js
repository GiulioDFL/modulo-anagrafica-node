const express = require('express');
const db = require('./database/definition/init');
const app = express();
const port = 3001;

// Imposta EJS come view engine
app.set('view engine', 'ejs');

// Middleware per il parsing del corpo delle richieste in formato JSON
// Utile se devi gestire dati inviati tramite POST
app.use(express.json());
// Middleware per il parsing dei dati inviati tramite form HTML
app.use(express.urlencoded({ extended: true }));

// Rotte
app.use(require('./routes/home'));
app.use(require('./routes/anagrafica/societa-get'));
app.use(require('./routes/anagrafica/societa-view'));
app.use(require('./routes/anagrafica/societa-dettaglio'));
app.use(require('./routes/anagrafica/societa-add'));
app.use(require('./routes/anagrafica/societa-edit'));
app.use(require('./routes/anagrafica/societa-delete'));
app.use(require('./routes/anagrafica/sedi-view'));
app.use(require('./routes/anagrafica/sedi-get'));
app.use(require('./routes/anagrafica/sedi-dettaglio'));
app.use(require('./routes/anagrafica/sedi-add'));
app.use(require('./routes/anagrafica/sedi-edit'));
app.use(require('./routes/anagrafica/sedi-delete'));
app.use(require('./routes/anagrafica/tipi-sede'));
app.use(require('./routes/anagrafica/settori'));
app.use(require('./routes/anagrafica/uffici-view'));
app.use(require('./routes/anagrafica/uffici-get'));
app.use(require('./routes/anagrafica/uffici-add'));
app.use(require('./routes/anagrafica/uffici-edit'));
app.use(require('./routes/anagrafica/uffici-delete'));
app.use(require('./routes/anagrafica/tipi-ufficio'));
app.use(require('./routes/util/gemini'));

// Avvio del server
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
