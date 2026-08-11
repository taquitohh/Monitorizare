/* =========================================================
   CHESTIONARE SPECIALIZATE PENTRU INCIDENTE
========================================================= */


/* =========================================================
   1. RAPOARTE / CHESTIONARE SPECIALIZATE
========================================================= */

CREATE TABLE IF NOT EXISTS incident_specialist_reports (

    id INT NOT NULL AUTO_INCREMENT,

    incident_id BIGINT NOT NULL,

    service_type ENUM(
        'police',
        'ambulance',
        'firefighters'
    ) NOT NULL,

    status ENUM(
        'pending',
        'in_progress',
        'confirmed'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    confirmed_at TIMESTAMP NULL,

    confirmed_by_user_id INT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_incident_specialist_service (
        incident_id,
        service_type
    ),

    KEY idx_specialist_report_incident (
        incident_id
    ),

    KEY idx_specialist_report_status (
        status
    ),

    KEY idx_specialist_report_service (
        service_type
    ),

    KEY idx_specialist_report_confirmed_by (
        confirmed_by_user_id
    ),

    CONSTRAINT fk_specialist_report_incident
        FOREIGN KEY (incident_id)
        REFERENCES incidents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_specialist_report_confirmed_by
        FOREIGN KEY (confirmed_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);


/* =========================================================
   2. RĂSPUNSURILE CHESTIONARELOR
========================================================= */

CREATE TABLE IF NOT EXISTS incident_specialist_answers (

    id INT NOT NULL AUTO_INCREMENT,

    report_id INT NOT NULL,

    question_code VARCHAR(100) NOT NULL,

    answer_value TEXT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_specialist_answer (
        report_id,
        question_code
    ),

    KEY idx_specialist_answer_report (
        report_id
    ),

    CONSTRAINT fk_specialist_answer_report
        FOREIGN KEY (report_id)
        REFERENCES incident_specialist_reports(id)
        ON DELETE CASCADE

);


/* =========================================================
   3. ISTORICUL MODIFICĂRILOR RĂSPUNSURILOR
========================================================= */

CREATE TABLE IF NOT EXISTS incident_specialist_answer_history (

    id BIGINT NOT NULL AUTO_INCREMENT,

    report_id INT NOT NULL,

    question_code VARCHAR(100) NOT NULL,

    answer_value TEXT NULL,

    changed_by_user_id INT NULL,

    changed_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_specialist_history_report (
        report_id
    ),

    KEY idx_specialist_history_question (
        question_code
    ),

    KEY idx_specialist_history_changed_at (
        changed_at
    ),

    KEY idx_specialist_history_user (
        changed_by_user_id
    ),

    CONSTRAINT fk_specialist_history_report
        FOREIGN KEY (report_id)
        REFERENCES incident_specialist_reports(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_specialist_history_user
        FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);