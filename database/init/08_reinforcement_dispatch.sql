/* =====================================
   EXTINDERE CERERI DE ÎNTĂRIRI

   Flux:
   - șoferul trimite cererea;
   - dispecerul o acceptă sau o respinge;
   - dispecerul alege tipurile și numărul
     vehiculelor trimise;
   - decizia și mesajele rămân salvate
     pentru raportul final.
===================================== */


/* =====================================
   STATUS NOU: RESPINSĂ
===================================== */

ALTER TABLE reinforcement_requests

    MODIFY COLUMN status ENUM(
        'pending',
        'partially_assigned',
        'accepted',
        'rejected',
        'completed',
        'cancelled',
        'failed'
    )
    NOT NULL
    DEFAULT 'pending';


/* =====================================
   DATE SUPLIMENTARE CERERE
===================================== */

ALTER TABLE reinforcement_requests

    ADD COLUMN requested_message TEXT
        NULL
        AFTER requested_quantity,

    ADD COLUMN dispatcher_message TEXT
        NULL
        AFTER failure_message,

    ADD COLUMN reviewed_by_user_id INT
        NULL
        AFTER dispatcher_message,

    ADD COLUMN reviewed_at TIMESTAMP
        NULL
        DEFAULT NULL
        AFTER reviewed_by_user_id;


/* =====================================
   UTILIZATORUL CARE A LUAT DECIZIA
===================================== */

ALTER TABLE reinforcement_requests

    ADD CONSTRAINT fk_reinforcement_reviewed_by_user

        FOREIGN KEY (
            reviewed_by_user_id
        )

        REFERENCES users (
            id
        )

        ON DELETE SET NULL;


/* =====================================
   INDEX PENTRU CERERI REVIZUITE
===================================== */

ALTER TABLE reinforcement_requests

    ADD KEY idx_reinforcement_reviewed_by_user (
        reviewed_by_user_id
    ),

    ADD KEY idx_reinforcement_reviewed_at (
        reviewed_at
    );


/* =====================================
   RESURSE CERUTE ȘI APROBATE

   O cerere poate primi:
   - poliție;
   - ambulanță;
   - pompieri;
   - orice combinație între ele.
===================================== */

CREATE TABLE IF NOT EXISTS reinforcement_request_resources (

    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    reinforcement_request_id BIGINT
        NOT NULL,

    vehicle_type ENUM(
        'police',
        'ambulance',
        'fire'
    )
        NOT NULL,

    requested_quantity INT UNSIGNED
        NOT NULL
        DEFAULT 0,

    approved_quantity INT UNSIGNED
        NOT NULL
        DEFAULT 0,

    assigned_quantity INT UNSIGNED
        NOT NULL
        DEFAULT 0,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    /* =====================================
       LEGĂTURĂ CU CEREREA
    ===================================== */

    CONSTRAINT fk_reinforcement_resource_request

        FOREIGN KEY (
            reinforcement_request_id
        )

        REFERENCES reinforcement_requests (
            id
        )

        ON DELETE CASCADE,


    /* =====================================
       UN SINGUR RÂND PENTRU FIECARE TIP
    ===================================== */

    UNIQUE KEY uq_reinforcement_resource_type (
        reinforcement_request_id,
        vehicle_type
    ),


    /* =====================================
       INDEXURI
    ===================================== */

    KEY idx_reinforcement_resource_request (
        reinforcement_request_id
    ),

    KEY idx_reinforcement_resource_vehicle_type (
        vehicle_type
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_uca1400_ai_ci;