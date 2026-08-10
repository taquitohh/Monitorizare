-- =====================================================
-- INCIDENTE CU MAI MULTE TIPURI DE VEHICULE
-- ȘI MAI MULTE VEHICULE ASIGNATE
-- =====================================================


-- =====================================================
-- CERINȚELE INCIDENTULUI
-- =====================================================

CREATE TABLE IF NOT EXISTS incident_requirements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,

    vehicle_type ENUM(
        'police',
        'ambulance',
        'fire'
    ) NOT NULL,

    quantity INT UNSIGNED NOT NULL DEFAULT 1,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_requirements_incident
        FOREIGN KEY (
            incident_id
        )
        REFERENCES incidents (
            id
        )
        ON DELETE CASCADE,

    CONSTRAINT chk_incident_requirement_quantity
        CHECK (
            quantity >= 1
            AND quantity <= 20
        ),

    UNIQUE KEY uq_incident_requirement_type (
        incident_id,
        vehicle_type
    ),

    KEY idx_incident_requirements_incident (
        incident_id
    ),

    KEY idx_incident_requirements_vehicle_type (
        vehicle_type
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;


-- =====================================================
-- VEHICULELE ASIGNATE INCIDENTULUI
-- =====================================================

CREATE TABLE IF NOT EXISTS incident_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,

    vehicle_id INT NOT NULL,

    assignment_type ENUM(
        'primary',
        'reinforcement'
    ) NOT NULL DEFAULT 'primary',

    status ENUM(
        'assigned',
        'in_progress',
        'arrived',
        'released',
        'cancelled'
    ) NOT NULL DEFAULT 'assigned',

    assigned_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    arrived_at TIMESTAMP
        NULL
        DEFAULT NULL,

    released_at TIMESTAMP
        NULL
        DEFAULT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_incident_assignments_incident
        FOREIGN KEY (
            incident_id
        )
        REFERENCES incidents (
            id
        )
        ON DELETE CASCADE,

    CONSTRAINT fk_incident_assignments_vehicle
        FOREIGN KEY (
            vehicle_id
        )
        REFERENCES vehicles (
            id
        )
        ON DELETE RESTRICT,

    UNIQUE KEY uq_incident_assignment_vehicle (
        incident_id,
        vehicle_id
    ),

    KEY idx_incident_assignments_incident_status (
        incident_id,
        status
    ),

    KEY idx_incident_assignments_vehicle_status (
        vehicle_id,
        status
    ),

    KEY idx_incident_assignments_type (
        assignment_type
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;


-- =====================================================
-- MIGRAREA CERINȚELOR EXISTENTE
-- =====================================================

INSERT IGNORE INTO incident_requirements (
    incident_id,
    vehicle_type,
    quantity
)
SELECT
    id,
    required_vehicle_type,
    1

FROM incidents

WHERE
    required_vehicle_type IS NOT NULL

    AND required_vehicle_type IN (
        'police',
        'ambulance',
        'fire'
    );


-- =====================================================
-- MIGRAREA ASIGNĂRILOR EXISTENTE
-- =====================================================

INSERT IGNORE INTO incident_assignments (
    incident_id,
    vehicle_id,
    assignment_type,
    status,
    assigned_at,
    arrived_at,
    released_at
)
SELECT
    i.id,
    i.assigned_vehicle_id,
    'primary',

    CASE
        WHEN i.status = 'in_progress'
            THEN 'in_progress'

        WHEN i.status = 'resolved'
            THEN 'released'

        WHEN i.status = 'cancelled'
            THEN 'cancelled'

        ELSE 'assigned'
    END,

    COALESCE(
        i.dispatched_at,
        i.created_at,
        CURRENT_TIMESTAMP
    ),

    CASE
        WHEN i.status = 'resolved'
            THEN i.resolved_at

        ELSE NULL
    END,

    CASE
        WHEN i.status IN (
            'resolved',
            'cancelled'
        )
            THEN COALESCE(
                i.resolved_at,
                i.updated_at
            )

        ELSE NULL
    END

FROM incidents i

WHERE i.assigned_vehicle_id IS NOT NULL;