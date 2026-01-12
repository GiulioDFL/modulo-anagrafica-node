SELECT *
FROM societa
WHERE (:id IS NULL OR id = :id)
  AND LOWER(COALESCE(ragione_sociale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:ragione_sociale)), ''), '') || '%'
  AND LOWER(COALESCE(partita_iva, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:partita_iva)), ''), '') || '%'
  AND LOWER(COALESCE(codice_fiscale, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_fiscale)), ''), '') || '%'
  AND LOWER(COALESCE(codice_destinatario, '')) LIKE '%' || COALESCE(NULLIF(LOWER(TRIM(:codice_destinatario)), ''), '') || '%'
  AND CURRENT_TIMESTAMP BETWEEN t_dt_esist_init AND t_dt_esist_scad
ORDER BY ragione_sociale ASC