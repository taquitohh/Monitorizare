-- Useful queries for inspecting the database

SHOW TABLES;

DESCRIBE vehicles;
DESCRIBE current_positions;
DESCRIBE position_history;

SELECT COUNT(*) AS total_vehicles FROM vehicles;
SELECT COUNT(*) AS total_current_positions FROM current_positions;
SELECT COUNT(*) AS total_history_entries FROM position_history;

SELECT v.vehicle_code, v.status, cp.latitude, cp.longitude, cp.speed
FROM vehicles v
LEFT JOIN current_positions cp ON v.id = cp.vehicle_id
ORDER BY v.id;
