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
  AND (
       LOWER(COALESCE(soc.ragione_sociale, '')) LIKE :search
       OR 
       LOWER(COALESCE(i.comune, '')) LIKE :search
  )
ORDER BY soc.ragione_sociale, cva.valore
