/* =====================================
   CERERI DE ÎNTĂRIRI
===================================== */

CREATE TABLE IF NOT EXISTS reinforcement_requests (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,

    requested_by_vehicle_id INT NOT NULL,

    requested_vehicle_type VARCHAR(20) NOT NULL,

    requested_quantity INT UNSIGNED
        NOT NULL
        DEFAULT 1,

    assigned_quantity INT UNSIGNED
        NOT NULL
        DEFAULT 0,

    status ENUM(
        'pending',
        'partially_assigned',
        'accepted',
        'completed',
        'cancelled',
        'failed'
    )
        NOT NULL
        DEFAULT 'pending',

    failure_message VARCHAR(255)
        DEFAULT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    completed_at TIMESTAMP
        NULL
        DEFAULT NULL,


    /* =====================================
       LEGĂTURI
    ===================================== */

    CONSTRAINT fk_reinforcement_request_incident

        FOREIGN KEY (
            incident_id
        )

        REFERENCES incidents (
            id
        )

        ON DELETE CASCADE,


    CONSTRAINT fk_reinforcement_request_vehicle

        FOREIGN KEY (
            requested_by_vehicle_id
        )

        REFERENCES vehicles (
            id
        )

        ON DELETE CASCADE,


    /* =====================================
       INDEXURI
    ===================================== */

    KEY idx_reinforcement_request_incident (
        incident_id
    ),

    KEY idx_reinforcement_request_vehicle (
        requested_by_vehicle_id
    ),

    KEY idx_reinforcement_request_status (
        status
    ),

    KEY idx_reinforcement_request_created_at (
        created_at
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;