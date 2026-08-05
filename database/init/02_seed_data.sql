-- Sample seed data for local development

INSERT INTO vehicles (id, vehicle_code, name, vehicle_type, status)
VALUES
    (1, 'VEH-001', 'Vehicle 1', 'police', 'active'),
    (2, 'VEH-002', 'Vehicle 2', 'ambulance', 'active'),
    (3, 'VEH-003', 'Vehicle 3', 'fire', 'active')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    vehicle_type = VALUES(vehicle_type),
    status = VALUES(status);

INSERT INTO current_positions (vehicle_id, latitude, longitude, speed, updated_at)
VALUES
    (1, 44.4316342, 26.0938337, 19.36, '2026-07-28 07:32:26'),
    (2, 44.3974374, 26.0427608, 33.93, '2026-07-28 07:32:39'),
    (3, 44.3942095, 26.0456186, 15.13, '2026-07-28 07:31:32')
ON DUPLICATE KEY UPDATE
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    speed = VALUES(speed),
    updated_at = VALUES(updated_at);
