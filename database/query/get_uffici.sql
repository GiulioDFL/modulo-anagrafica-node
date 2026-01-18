SELECT 
    u.id, 
    u.societa_id, 
    u.sede_id, 
    u.cva_tipo_ufficio_id, 
    u.nome_ufficio,
    cva.valore as tipo_ufficio,
    soc.ragione_sociale,
    i.via as sede_via,
    i.numero_civico as sede_numero_civico,
    i.cap as sede_cap,
    i.comune as sede_comune,
    i.provincia as sede_provincia,
    i.paese as sede_paese,
    cva_sede.valore as sede_tipo,
    CASE 
        WHEN u.sede_id IS NOT NULL THEN 'Sede ' || cva_sede.valore || ' - ' || i.comune || ' (' || i.provincia || ')'
        ELSE 'Sede Legale / Intera Società' 
    END as collocazione
FROM uffici u
JOIN chiave_valore_attributo cva ON u.cva_tipo_ufficio_id = cva.id
JOIN societa soc ON u.societa_id = soc.id
LEFT JOIN sedi s ON u.sede_id = s.id
LEFT JOIN chiave_valore_attributo cva_sede ON s.cva_tipo_sede_id = cva_sede.id
LEFT JOIN indirizzi i ON s.indirizzo_id = i.id
WHERE (:societa_id IS NULL OR u.societa_id = :societa_id)
AND (:id IS NULL OR u.id = :id)
AND (:sede_id IS NULL OR u.sede_id = :sede_id)
AND (:search IS NULL OR u.nome_ufficio LIKE :search OR cva.valore LIKE :search)
ORDER BY u.id DESC