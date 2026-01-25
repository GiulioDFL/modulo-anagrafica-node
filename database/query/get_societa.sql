SELECT s.*, GROUP_CONCAT(cva.valore, ', ') as settori
FROM societa s
LEFT JOIN legm_societa_attributi lsa ON s.id = lsa.societa_id
LEFT JOIN chiave_valore_attributo cva ON lsa.attributo_id = cva.id AND cva.gruppo = 'TIPI_SETTORE'
WHERE (:id IS NULL OR s.id = :id)
  AND LOWER(COALESCE(s.ragione_sociale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:ragione_sociale)), ''), '') || '%'
  AND LOWER(COALESCE(s.partita_iva, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:partita_iva)), ''), '') || '%'
  AND LOWER(COALESCE(s.codice_fiscale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_fiscale)), ''), '') || '%'
  AND LOWER(COALESCE(s.codice_destinatario, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_destinatario)), ''), '') || '%'
  AND CURRENT_TIMESTAMP BETWEEN s.t_dt_esist_init AND s.t_dt_esist_scad
GROUP BY s.id
ORDER BY s.ragione_sociale ASC