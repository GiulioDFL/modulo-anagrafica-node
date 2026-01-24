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
CREATE INDEX IF NOT EXISTS idx_persone_indirizzi_indirizzo ON legm_persone_fisiche_indirizzi (indirizzo_id);

-- sedi
CREATE TABLE IF NOT EXISTS sedi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- legm_sedi_attributi (es. Tipo Sede: Legale, Operativa)
CREATE TABLE IF NOT EXISTS legm_sedi_attributi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    attributo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (sede_id, attributo_id)
);

-- legm_societa_sedi
CREATE TABLE IF NOT EXISTS legm_societa_sedi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, sede_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_soc_sedi_sede ON legm_societa_sedi (sede_id);

-- legm_societa_attributi (es. Settore)
CREATE TABLE IF NOT EXISTS legm_societa_attributi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    attributo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, attributo_id)
);

-- legm_sedi_indirizzi
CREATE TABLE IF NOT EXISTS legm_sedi_indirizzi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    indirizzo_id INTEGER NOT NULL REFERENCES indirizzi(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (sede_id, indirizzo_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_sedi_ind_ind ON legm_sedi_indirizzi (indirizzo_id);

-- referenti
CREATE TABLE IF NOT EXISTS referenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- legm_referenti_attributi (es. Ruolo)
CREATE TABLE IF NOT EXISTS legm_referenti_attributi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    attributo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (referente_id, attributo_id)
);

-- legm_referenti_persone
CREATE TABLE IF NOT EXISTS legm_referenti_persone (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (referente_id, persona_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_ref_pers_pers ON legm_referenti_persone (persona_id);

-- legm_societa_referenti
CREATE TABLE IF NOT EXISTS legm_societa_referenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, referente_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_soc_ref_ref ON legm_societa_referenti (referente_id);

-- legm_sedi_referenti
CREATE TABLE IF NOT EXISTS legm_sedi_referenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (sede_id, referente_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_sedi_ref_ref ON legm_sedi_referenti (referente_id);

-- legm_uffici_referenti
CREATE TABLE IF NOT EXISTS legm_uffici_referenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ufficio_id INTEGER NOT NULL REFERENCES uffici(id) ON DELETE CASCADE,
    referente_id INTEGER NOT NULL REFERENCES referenti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (ufficio_id, referente_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_uff_ref_ref ON legm_uffici_referenti (referente_id);

-- uffici
CREATE TABLE IF NOT EXISTS uffici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_ufficio TEXT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT
);

-- legm_uffici_attributi (es. Tipo Ufficio)
CREATE TABLE IF NOT EXISTS legm_uffici_attributi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ufficio_id INTEGER NOT NULL REFERENCES uffici(id) ON DELETE CASCADE,
    attributo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (ufficio_id, attributo_id)
);

-- legm_societa_uffici
CREATE TABLE IF NOT EXISTS legm_societa_uffici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    societa_id INTEGER NOT NULL REFERENCES societa(id) ON DELETE CASCADE,
    ufficio_id INTEGER NOT NULL REFERENCES uffici(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (societa_id, ufficio_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_soc_uff_uff ON legm_societa_uffici (ufficio_id);

-- legm_sedi_uffici
CREATE TABLE IF NOT EXISTS legm_sedi_uffici (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    ufficio_id INTEGER NOT NULL REFERENCES uffici(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (sede_id, ufficio_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_sedi_uff_uff ON legm_sedi_uffici (ufficio_id);

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
CREATE INDEX IF NOT EXISTS idx_societa_contatti_contatto ON legm_societa_contatti (contatto_id);

-- legm_sedi_contatti
CREATE TABLE IF NOT EXISTS legm_sedi_contatti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
    contatto_id INTEGER NOT NULL REFERENCES contatti(id) ON DELETE CASCADE,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (sede_id, contatto_id)
);
CREATE INDEX IF NOT EXISTS idx_legm_sedi_cont_cont ON legm_sedi_contatti (contatto_id);

-- legm_persone_fisiche_attributi (es. Competenze)
CREATE TABLE IF NOT EXISTS legm_persone_fisiche_attributi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id INTEGER NOT NULL REFERENCES persone_fisiche(id) ON DELETE CASCADE,
    attributo_id INTEGER NOT NULL REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    valore_id INTEGER REFERENCES chiave_valore_attributo(id) ON DELETE RESTRICT,
    t_dt_esist_init TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_dt_esist_scad TEXT NOT NULL DEFAULT '9999-12-31 00:00:00',
    t_note TEXT,
    UNIQUE (persona_id, attributo_id)
);
CREATE INDEX IF NOT EXISTS idx_pers_attr_attributo ON legm_persone_fisiche_attributi (attributo_id);

-- Trigger: Impedisce di collegare una seconda Sede Legale alla stessa Società (INSERT su legm_societa_sedi)
CREATE TRIGGER IF NOT EXISTS check_sede_legale_insert_link
BEFORE INSERT ON legm_societa_sedi
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Errore: Questa società ha già una Sede Legale.')
    WHERE EXISTS (
        SELECT 1
        FROM legm_societa_sedi lss
        JOIN legm_sedi_attributi lsa ON lss.sede_id = lsa.sede_id
        JOIN chiave_valore_attributo cva ON lsa.attributo_id = cva.id
        WHERE lss.societa_id = NEW.societa_id
          AND cva.gruppo = 'TIPI_SEDE' AND cva.chiave = 'LEGALE'
    )
    AND EXISTS (
        SELECT 1
        FROM legm_sedi_attributi lsa_new
        JOIN chiave_valore_attributo cva_new ON lsa_new.attributo_id = cva_new.id
        WHERE lsa_new.sede_id = NEW.sede_id
          AND cva_new.gruppo = 'TIPI_SEDE' AND cva_new.chiave = 'LEGALE'
    );
END;

-- Trigger: Impedisce di aggiungere l'attributo 'LEGALE' a una sede se la società collegata ne ha già una (INSERT su legm_sedi_attributi)
CREATE TRIGGER IF NOT EXISTS check_sede_legale_insert_attrib
BEFORE INSERT ON legm_sedi_attributi
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'Errore: Impossibile impostare Sede Legale. Una delle società collegate ne possiede già una.')
    WHERE NEW.attributo_id IN (SELECT id FROM chiave_valore_attributo WHERE gruppo = 'TIPI_SEDE' AND chiave = 'LEGALE')
    AND EXISTS (
        SELECT 1
        FROM legm_societa_sedi lss_current
        JOIN legm_societa_sedi lss_other ON lss_current.societa_id = lss_other.societa_id
        JOIN legm_sedi_attributi lsa_other ON lss_other.sede_id = lsa_other.sede_id
        JOIN chiave_valore_attributo cva_other ON lsa_other.attributo_id = cva_other.id
        WHERE lss_current.sede_id = NEW.id
          AND lss_other.sede_id <> NEW.id
          AND cva_other.gruppo = 'TIPI_SEDE' AND cva_other.chiave = 'LEGALE'
    );
END;
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