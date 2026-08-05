# Database documentation

## Overview

This project uses MariaDB as the persistence layer for vehicle tracking data.

## Main tables

- vehicles: core vehicle definitions and status
- current_positions: latest position received for each vehicle
- position_history: historical position records

## Storage location

The database container persists data in the Docker volume named `db_data`.

## Useful commands

```bash
docker compose exec database mariadb -u gps_user -pstudent2026 gps_tracking
SHOW TABLES;
DESCRIBE vehicles;
SELECT COUNT(*) AS total_vehicles FROM vehicles;
SELECT COUNT(*) AS total_positions FROM position_history;
```
