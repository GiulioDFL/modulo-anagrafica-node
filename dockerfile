# Usiamo l'ultima versione LTS (Long Term Support) su base Alpine per massima leggerezza
FROM node:22-alpine

# Specifichiamo la directory di lavoro nel container
WORKDIR /app

# Copiamo i file dei pacchetti per installare le dipendenze
COPY package*.json ./
RUN npm install

# Copiamo tutto il resto del codice (incluso index.js)
COPY . .

# Definiamo la porta di default e la esponiamo
ENV PORT=3000
EXPOSE ${PORT}

# Avviamo l'applicazione
CMD ["node", "index.js"]