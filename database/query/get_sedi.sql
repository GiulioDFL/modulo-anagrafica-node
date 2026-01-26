SELECT 
    s.id,
    lss.societa_id,
    soc.ragione_sociale,
    lsi.indirizzo_id,
    i.via,
    i.numero_civico,
    i.cap,
    i.comune,
    i.provincia,
    i.paese,
    GROUP_CONCAT(cva.valore, ', ') as tipi_sede
FROM sedi s
JOIN legm_societa_sedi lss ON s.id = lss.sede_id
JOIN societa soc ON lss.societa_id = soc.id
JOIN legm_sedi_indirizzi lsi ON s.id = lsi.sede_id
JOIN indirizzi i ON lsi.indirizzo_id = i.id
LEFT JOIN legm_sedi_attributi lsa ON s.id = lsa.sede_id
LEFT JOIN chiave_valore_attributo cva ON lsa.attributo_id = cva.id
WHERE 1=1
  AND (:id IS NULL OR s.id = :id)
  AND (:societa_id IS NULL OR lss.societa_id = :societa_id)
  AND (
       LOWER(COALESCE(i.via, '')) LIKE :search
       OR LOWER(COALESCE(i.numero_civico, '')) LIKE :search
       OR LOWER(COALESCE(i.cap, '')) LIKE :search
       OR LOWER(COALESCE(i.comune, '')) LIKE :search
       OR LOWER(COALESCE(i.provincia, '')) LIKE :search
       OR LOWER(COALESCE(cva.valore, '')) LIKE :search
  )
GROUP BY s.id
ORDER BY soc.ragione_sociale
