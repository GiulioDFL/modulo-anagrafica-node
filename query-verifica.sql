SELECT 
    r.id AS referente_id,
    p.cognome,
    p.nome,
    cva.id AS attributo_id,
    cva.valore AS ruolo,
    cva.gruppo
FROM referenti r
-- Join per recuperare i dati anagrafici della persona collegata al referente
JOIN legm_referenti_persone lrp ON r.id = lrp.referente_id
JOIN persone_fisiche p ON lrp.persona_id = p.id
-- Join per recuperare gli attributi (tag) collegati
JOIN legm_referenti_attributi lra ON r.id = lra.referente_id
JOIN chiave_valore_attributo cva ON lra.attributo_id = cva.id
WHERE cva.gruppo = 'TIPI_RUOLO';
