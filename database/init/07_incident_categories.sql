-- =====================================================
-- CATEGORII MULTIPLE PENTRU INCIDENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS incident_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,

    category_code VARCHAR(50) NOT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_categories_incident
        FOREIGN KEY (
            incident_id
        )
        REFERENCES incidents (
            id
        )
        ON DELETE CASCADE,

    UNIQUE KEY uq_incident_category (
        incident_id,
        category_code
    ),

    KEY idx_incident_categories_incident (
        incident_id
    ),

    KEY idx_incident_categories_code (
        category_code
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;


-- Migrarea incidentelor deja existente.

INSERT IGNORE INTO incident_categories (
    incident_id,
    category_code
)
SELECT
    id,
    incident_type

FROM incidents

WHERE
    incident_type IS NOT NULL

    AND TRIM(
        incident_type
    ) != '';