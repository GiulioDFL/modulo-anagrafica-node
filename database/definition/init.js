const sqlite3 = require('sqlite3').verbose();

// Inizializzazione Database SQLite
const db = new sqlite3.Database('./database/database.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connesso al database SQLite.');
});

// Abilita le Foreign Keys (disabilitate di default in SQLite)
db.run("PRAGMA foreign_keys = ON");

const schema = `
-- Tabella esistente (mantenuta per compatibilità)
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);

-- chiave_valore_attributo
CREATE TABLE IF NOT EXISTS chiave_valore_attributo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gruppo TEXT NOT NULL,
    chiave TEXT NOT NULL,
    valore TEXT NOT NULL,
    attributo TEXT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_kv_gruppo ON chiave_valore_attributo (gruppo);

-- indirizzi
CREATE TABLE IF NOT EXISTS indirizzi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    via TEXT,
    numero_civico TEXT,
    cap TEXT,
    comune TEXT,
    provincia TEXT,
    paese TEXT NOT NULL,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- persone_fisiche
CREATE TABLE IF NOT EXISTS persone_fisiche (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    data_nascita TEXT,
    codice_fiscale TEXT UNIQUE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- societa
CREATE TABLE IF NOT EXISTS societa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ragione_sociale TEXT NOT NULL,
    partita_iva TEXT UNIQUE,
    codice_fiscale TEXT,
    codice_destinatario TEXT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- contatti
CREATE TABLE IF NOT EXISTS contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cva_tipo_contatto_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    valore TEXT UNIQUE NOT NULL,
    token_validazione TEXT UNIQUE DEFAULT NULL,
    token_data_fine TEXT DEFAULT NULL,
    data_validazione TEXT DEFAULT NULL,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- legm_persone_fisiche_contatti
CREATE TABLE IF NOT EXISTS legm_persone_fisiche_contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    contatto_id INTEGER NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (persona_id, contatto_id)
);
CREATE INDEX IF NOT EXISTS idx_persone_contatti_persona ON legm_persone_fisiche_contatti (persona_id);
CREATE INDEX IF NOT EXISTS idx_persone_contatti_contatto ON legm_persone_fisiche_contatti (contatto_id);

-- legm_persone_fisiche_indirizzi
CREATE TABLE IF NOT EXISTS legm_persone_fisiche_indirizzi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    indirizzo_id INTEGER NOT NULL REFERENCES indirizzi(id) ON DELETE CASCADE,
    cva_tipo_indirizzo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (persona_id, indirizzo_id, cva_tipo_indirizzo_id)
);
CREATE INDEX IF NOT EXISTS idx_persone_indirizzi_persona ON legm_persone_fisiche_indirizzi (persona_id);
CREATE INDEX IF NOT EXISTS idx_persone_indirizzi_indirizzo ON legm_persone_fisiche_indirizzi (indirizzo_id);

-- sedi
CREATE TABLE IF NOT EXISTS sedi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    indirizzo_id INTEGER NOT NULL REFERENCES indirizzi(id) ON DELETE CASCADE,
    cva_tipo_sede_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, indirizzo_id, cva_tipo_sede_id)
);
CREATE INDEX IF NOT EXISTS idx_sedi_societa ON sedi (societa_id);
CREATE INDEX IF NOT EXISTS idx_sedi_indirizzo ON sedi (indirizzo_id);

-- referenti
CREATE TABLE IF NOT EXISTS referenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    sede_id INTEGER REFERENCES sedi(id) ON DELETE RESTRICT,
    ufficio_id INTEGER REFERENCES uffici(id) ON DELETE RESTRICT,
    cva_tipo_ruolo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (persona_id, societa_id)
);
CREATE INDEX IF NOT EXISTS idx_referenti_persona ON referenti(persona_id);
CREATE INDEX IF NOT EXISTS idx_referenti_societa ON referenti(societa_id);

-- uffici
CREATE TABLE IF NOT EXISTS uffici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    sede_id INTEGER REFERENCES sedi(id) ON DELETE RESTRICT,
    cva_tipo_ufficio_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    nome_ufficio TEXT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, sede_id, cva_tipo_ufficio_id)
);
CREATE INDEX IF NOT EXISTS idx_uffici_societa ON uffici(societa_id);

-- legm_referenti_contatti
CREATE TABLE IF NOT EXISTS legm_referenti_contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    contatto_id INTEGER NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (referente_id, contatto_id)
);
CREATE INDEX IF NOT EXISTS idx_referenti_contatti_referente ON legm_referenti_contatti (referente_id);
CREATE INDEX IF NOT EXISTS idx_referenti_contatti_contatto ON legm_referenti_contatti (contatto_id);

-- legm_uffici_contatti
CREATE TABLE IF NOT EXISTS legm_uffici_contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ufficio_id INTEGER NOT NULL REFERENCES uffici(id) ON DELETE CASCADE,
    contatto_id INTEGER NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (ufficio_id, contatto_id)
);
CREATE INDEX IF NOT EXISTS idx_uffici_contatti_uffici ON legm_uffici_contatti (ufficio_id);
CREATE INDEX IF NOT EXISTS idx_uffici_contatti_contatto ON legm_uffici_contatti (contatto_id);

-- legm_societa_contatti
CREATE TABLE IF NOT EXISTS legm_societa_contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    contatto_id INTEGER NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, contatto_id)
);
CREATE INDEX IF NOT EXISTS idx_societa_contatti_societa ON legm_societa_contatti (societa_id);
CREATE INDEX IF NOT EXISTS idx_societa_contatti_contatto ON legm_societa_contatti (contatto_id);

-- legm_persone_fisiche_competenze
CREATE TABLE IF NOT EXISTS legm_persone_fisiche_competenze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    competenza_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    livello INTEGER REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (persona_id, competenza_id)
);
CREATE INDEX IF NOT EXISTS idx_pers_competenze_persona ON legm_persone_fisiche_competenze (persona_id);
CREATE INDEX IF NOT EXISTS idx_pers_competenze_competenza ON legm_persone_fisiche_competenze (competenza_id);

-- Trigger per garantire un'unica sede legale per società (INSERT)
CREATE TRIGGER IF NOT EXISTS check_sede_legale_insert
BEFORE INSERT ON sedi
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Errore: esiste già una sede legale per questa società')
    WHERE NEW.cva_tipo_sede_id = (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'LEGALE')
    AND EXISTS (
        SELECT 1 FROM sedi
        WHERE societa_id = NEW.societa_id
          AND cva_tipo_sede_id = NEW.cva_tipo_sede_id
    );
END;

-- Trigger per garantire un'unica sede legale per società (UPDATE)
CREATE TRIGGER IF NOT EXISTS check_sede_legale_update
BEFORE UPDATE ON sedi
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Errore: esiste già una sede legale per questa società')
    WHERE NEW.cva_tipo_sede_id = (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'LEGALE')
    AND EXISTS (
        SELECT 1 FROM sedi
        WHERE societa_id = NEW.societa_id
          AND cva_tipo_sede_id = NEW.cva_tipo_sede_id
          AND id <> OLD.id
    );
END;

-- Seed Dati: TIPI_SEDE
INSERT INTO chiave_valore_attributo (gruppo, chiave, valore)
SELECT 'TIPI_SEDE', 'LEGALE', 'Legale'
WHERE NOT EXISTS (SELECT 1 FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'LEGALE');

INSERT INTO chiave_valore_attributo (gruppo, chiave, valore)
SELECT 'TIPI_SEDE', 'OPERATIVA', 'Operativa'
WHERE NOT EXISTS (SELECT 1 FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'OPERATIVA');

INSERT INTO chiave_valore_attributo (gruppo, chiave, valore)
SELECT 'TIPI_SEDE', 'AMMINISTRATIVA', 'Amministrativa'
WHERE NOT EXISTS (SELECT 1 FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'AMMINISTRATIVA');

-- Aggiornamento valori esistenti (rimozione "Sede")
UPDATE chiave_valore_attributo SET valore = 'Legale' WHERE gruppo = 'TIPI_SEDE' AND chiave = 'LEGALE' AND valore = 'Sede Legale';
UPDATE chiave_valore_attributo SET valore = 'Operativa' WHERE gruppo = 'TIPI_SEDE' AND chiave = 'OPERATIVA' AND valore = 'Sede Operativa';
UPDATE chiave_valore_attributo SET valore = 'Amministrativa' WHERE gruppo = 'TIPI_SEDE' AND chiave = 'AMMINISTRATIVA' AND valore = 'Sede Amministrativa';
`;

// Esecuzione dello schema
db.exec(schema, (err) => {
  if (err) {
    console.error('Errore durante l\'inizializzazione del database:', err.message);
  } else {
    console.log('Database inizializzato con successo (Tabelle create/verificate).');
  }
});

module.exports = db;