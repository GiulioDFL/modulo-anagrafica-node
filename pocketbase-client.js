const PocketBase = require('pocketbase').default || require('pocketbase');
require('dotenv').config();

// Inizializzazione Singleton
const pb = new PocketBase(process.env.POCKET_BASE_URI);
pb.autoCancellation(false); // Disabilita auto-cancellazione per uso server-side

/**
 * Restituisce l'istanza di PocketBase autenticata.
 * Esegue il login solo se il token non è valido.
 */
module.exports = async () => {
    try {
        if (!pb.authStore.isValid) {
            await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        }
        return pb;
    } catch (err) {
        throw new Error("Errore autenticazione PocketBase: " + err.message);
    }
};