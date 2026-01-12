SELECT 
    s.id,
    s.societa_id,
    soc.ragione_sociale,
    s.indirizzo_id,
    i.via,
    i.numero_civico,
    i.cap,
    i.comune,
    i.provincia,
    i.paese,
    s.cva_tipo_sede_id,
    cva.valore as tipo_sede
FROM sedi s
JOIN societa soc ON s.societa_id = soc.id
JOIN indirizzi i ON s.indirizzo_id = i.id
JOIN chiave_valore_attributo cva ON s.cva_tipo_sede_id = cva.id
WHERE 1=1
  AND (:id IS NULL OR s.id = :id)
  AND (:societa_id IS NULL OR s.societa_id = :societa_id)
  AND (
       LOWER(COALESCE(i.via, '')) LIKE :search
       OR LOWER(COALESCE(i.numero_civico, '')) LIKE :search
       OR LOWER(COALESCE(i.cap, '')) LIKE :search
       OR LOWER(COALESCE(i.comune, '')) LIKE :search
       OR LOWER(COALESCE(i.provincia, '')) LIKE :search
       OR LOWER(COALESCE(cva.valore, '')) LIKE :search
  )
ORDER BY soc.ragione_sociale, cva.valore
