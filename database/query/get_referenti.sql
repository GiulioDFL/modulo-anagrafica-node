SELECT 
    r.id,
    lsr.societa_id,
    soc.ragione_sociale,
    lsede.sede_id,
    lsa.attributo_id as cva_tipo_sede_id,
    ts.valore as tipo_sede,
    i.via as sede_via, 
    i.numero_civico as sede_numero_civico, 
    i.cap as sede_cap, 
    i.comune as sede_comune, 
    i.provincia as sede_provincia, 
    i.paese as sede_paese,
    luff.ufficio_id,
    u.nome_ufficio,
    lua.attributo_id as cva_tipo_ufficio_id,
    tu.valore as tipo_ufficio,
    lrp.persona_id,
    p.nome,
    p.cognome,
    p.codice_fiscale,
    GROUP_CONCAT(cva.valore, ', ') as ruolo,
    CASE 
        WHEN u.id IS NOT NULL THEN 'Ufficio: ' || COALESCE(u.nome_ufficio, tu.valore)
        WHEN s.id IS NOT NULL THEN 'Sede: ' || COALESCE(i.comune, '') || ' (' || COALESCE(ts.valore, 'Sede') || ')'
        ELSE 'Società'
    END as contesto_sede
FROM referenti r
JOIN legm_referenti_persone lrp ON r.id = lrp.referente_id
JOIN persone_fisiche p ON lrp.persona_id = p.id
JOIN legm_referenti_attributi lra ON r.id = lra.referente_id
JOIN chiave_valore_attributo cva ON lra.attributo_id = cva.id
JOIN legm_societa_referenti lsr ON r.id = lsr.referente_id
JOIN societa soc ON lsr.societa_id = soc.id
LEFT JOIN legm_uffici_referenti luff ON r.id = luff.referente_id
LEFT JOIN uffici u ON luff.ufficio_id = u.id
LEFT JOIN legm_uffici_attributi lua ON u.id = lua.ufficio_id
LEFT JOIN chiave_valore_attributo tu ON lua.attributo_id = tu.id
LEFT JOIN legm_sedi_referenti lsede ON r.id = lsede.referente_id
LEFT JOIN sedi s ON lsede.sede_id = s.id
LEFT JOIN legm_sedi_indirizzi lsi ON s.id = lsi.sede_id
LEFT JOIN indirizzi i ON lsi.indirizzo_id = i.id
LEFT JOIN legm_sedi_attributi lsa ON s.id = lsa.sede_id
LEFT JOIN chiave_valore_attributo ts ON lsa.attributo_id = ts.id
WHERE (:id IS NULL OR r.id = :id)
  AND (:societa_id IS NULL OR lsr.societa_id = :societa_id)
  AND (:sede_id IS NULL OR lsede.sede_id = :sede_id)
  AND (:ufficio_id IS NULL OR luff.ufficio_id = :ufficio_id)
  AND (p.nome LIKE :search OR p.cognome LIKE :search OR cva.valore LIKE :search)
GROUP BY r.id
ORDER BY p.cognome, p.nome;