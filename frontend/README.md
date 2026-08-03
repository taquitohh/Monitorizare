# GPS Tracking System

A distributed GPS vehicle tracking application.

## Architecture

The project consists of:

- Raspberry Pi devices for GPS data generation
- Web servers for the application
- HAProxy for load balancing
- MariaDB database
- Docker containers

## Current structure

The application contains:

- Frontend
- Backend API
- Vehicle data
- Database configuration

## Network

| Device | IP |
|---|---|
| Raspberry Pi | 10.235.1.20 |
| HAProxy | 10.235.1.50 |
| Web1 | 10.235.1.51 |
| Web2 | 10.235.1.52 |
| Database | 10.235.1.60 |