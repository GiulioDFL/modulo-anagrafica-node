SELECT 
    u.id, 
    lsu.societa_id, 
    lsed.sede_id,
    u.nome_ufficio,
    GROUP_CONCAT(DISTINCT cva.valore, ', ') as tipi_ufficio,
    soc.ragione_sociale,
    i.via as sede_via,
    i.numero_civico as sede_numero_civico,
    i.cap as sede_cap,
    i.comune as sede_comune,
    i.provincia as sede_provincia,
    i.paese as sede_paese,
    cva_sede.valore as sede_tipo,
    CASE 
        WHEN lsed.sede_id IS NOT NULL THEN 'Sede ' || COALESCE(cva_sede.valore, '') || ' - ' || COALESCE(i.comune, '') || ' (' || COALESCE(i.provincia, '') || ')'
        ELSE 'Sede Legale / Intera Società' 
    END as collocazione
FROM uffici u
JOIN legm_societa_uffici lsu ON u.id = lsu.ufficio_id
JOIN societa soc ON lsu.societa_id = soc.id
LEFT JOIN legm_uffici_attributi lua ON u.id = lua.ufficio_id
LEFT JOIN chiave_valore_attributo cva ON lua.attributo_id = cva.id AND cva.gruppo = 'TIPI_UFFICIO'
LEFT JOIN legm_sedi_uffici lsed ON u.id = lsed.ufficio_id
LEFT JOIN sedi s ON lsed.sede_id = s.id
LEFT JOIN legm_sedi_attributi lsa ON s.id = lsa.sede_id
LEFT JOIN chiave_valore_attributo cva_sede ON lsa.attributo_id = cva_sede.id AND cva_sede.gruppo = 'TIPI_SEDE'
LEFT JOIN legm_sedi_indirizzi lsi ON s.id = lsi.sede_id
LEFT JOIN indirizzi i ON lsi.indirizzo_id = i.id
WHERE (:societa_id IS NULL OR lsu.societa_id = :societa_id)
AND (:id IS NULL OR u.id = :id)
AND (:sede_id IS NULL OR lsed.sede_id = :sede_id)
AND (:search IS NULL OR u.nome_ufficio LIKE :search OR cva.valore LIKE :search)
GROUP BY u.id
ORDER BY u.id DESC