/* =========================================================
   ISTORIC COMPLET INCIDENT
========================================================= */

CREATE TABLE IF NOT EXISTS incident_events (

    id BIGINT NOT NULL AUTO_INCREMENT,

    incident_id BIGINT NOT NULL,

    event_type VARCHAR(100) NOT NULL,

    source_type VARCHAR(50) NULL,

    source_id BIGINT NULL,

    service_type ENUM(
        'police',
        'ambulance',
        'firefighters'
    ) NULL,

    message TEXT NOT NULL,

    metadata_json LONGTEXT NULL,

    created_by_user_id INT NULL,

    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_incident_events_incident (
        incident_id
    ),

    KEY idx_incident_events_type (
        event_type
    ),

    KEY idx_incident_events_created_at (
        created_at
    ),

    KEY idx_incident_events_source (
        source_type,
        source_id
    ),

    KEY idx_incident_events_service (
        service_type
    ),

    KEY idx_incident_events_user (
        created_by_user_id
    ),

    KEY idx_incident_events_timeline (
        incident_id,
        created_at,
        id
    ),

    CONSTRAINT fk_incident_events_incident
        FOREIGN KEY (incident_id)
        REFERENCES incidents(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_incident_events_user
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL

);