SELECT 
    p.id,
    p.nome,
    p.cognome,
    p.data_nascita,
    p.codice_fiscale,
    GROUP_CONCAT(cva.valore, ', ') as competenze
FROM persone_fisiche p
LEFT JOIN legm_persone_fisiche_attributi lpa ON p.id = lpa.persona_id
LEFT JOIN chiave_valore_attributo cva ON lpa.attributo_id = cva.id AND cva.gruppo = 'TIPI_COMPETENZA'
WHERE (:id IS NULL OR p.id = :id)
  AND (p.nome LIKE :search OR p.cognome LIKE :search OR p.codice_fiscale LIKE :search OR cva.valore LIKE :search)
GROUP BY p.id
ORDER BY p.cognome, p.nome;