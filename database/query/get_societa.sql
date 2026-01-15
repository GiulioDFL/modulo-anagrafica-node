SELECT s.*, cva.valore as settore_descrizione
FROM societa s
LEFT JOIN chiave_valore_attributo cva ON s.cva_settore_id = cva.id
WHERE (:id IS NULL OR s.id = :id)
  AND (:settore_id IS NULL OR s.cva_settore_id = :settore_id)
  AND LOWER(COALESCE(s.ragione_sociale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:ragione_sociale)), ''), '') || '%'
  AND LOWER(COALESCE(s.partita_iva, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:partita_iva)), ''), '') || '%'
  AND LOWER(COALESCE(s.codice_fiscale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_fiscale)), ''), '') || '%'
  AND LOWER(COALESCE(s.codice_destinatario, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_destinatario)), ''), '') || '%'
  AND CURRENT_TIMESTAMP BETWEEN s.t_dt_esist_init AND s.t_dt_esist_scad
ORDER BY s.ragione_sociale ASC