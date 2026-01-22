SELECT 
    r.id,
    r.societa_id,
    soc.ragione_sociale,
    r.sede_id,
    s.cva_tipo_sede_id,
    ts.valore as tipo_sede,
    i.via, i.numero_civico, i.cap, i.comune, i.provincia, i.paese,
    r.ufficio_id,
    u.nome_ufficio,
    tu.valore as tipo_ufficio,
    r.persona_id,
    r.cva_tipo_ruolo_id,
    p.nome,
    p.cognome,
    p.codice_fiscale,
    cva.valore as ruolo,
    CASE 
        WHEN u.id IS NOT NULL THEN 'Ufficio: ' || COALESCE(u.nome_ufficio, tu.valore)
        WHEN s.id IS NOT NULL THEN 'Sede: ' || COALESCE(i.comune, '') || ' (' || COALESCE(ts.valore, 'Sede') || ')'
        ELSE 'Società'
    END as contesto
FROM referenti r
JOIN persone_fisiche p ON r.persona_id = p.id
JOIN chiave_valore_attributo cva ON r.cva_tipo_ruolo_id = cva.id
JOIN societa soc ON r.societa_id = soc.id
LEFT JOIN uffici u ON r.ufficio_id = u.id
LEFT JOIN chiave_valore_attributo tu ON u.cva_tipo_ufficio_id = tu.id
LEFT JOIN sedi s ON r.sede_id = s.id
LEFT JOIN indirizzi i ON s.indirizzo_id = i.id
LEFT JOIN chiave_valore_attributo ts ON s.cva_tipo_sede_id = ts.id
WHERE (:id IS NULL OR r.id = :id)
  AND (:societa_id IS NULL OR r.societa_id = :societa_id)
  AND (:sede_id IS NULL OR r.sede_id = :sede_id)
  AND (:ufficio_id IS NULL OR r.ufficio_id = :ufficio_id)
  AND (p.nome LIKE :search OR p.cognome LIKE :search OR cva.valore LIKE :search)
ORDER BY p.cognome, p.nome;