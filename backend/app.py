from flask import Flask, jsonify, request, Response
from flask_cors import CORS

import math
import os
import uuid

import pymysql

from route_service import RouteService
from report_service import IncidentReportService

app = Flask(__name__)

CORS(app)


DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": int(
        os.getenv(
            "DB_PORT",
            "3306"
        )
    ),
    "cursorclass":
        pymysql.cursors.DictCursor
}


route_service = RouteService()
report_service = IncidentReportService()


# =====================================
# DATABASE CONNECTION
# =====================================

def get_db_connection():

    return pymysql.connect(
        **DB_CONFIG
    )


# =====================================
# HAVERSINE DISTANCE
# =====================================

def calculate_haversine_distance(
    latitude_1,
    longitude_1,
    latitude_2,
    longitude_2
):

    earth_radius_km = 6371.0

    latitude_difference = math.radians(
        latitude_2 - latitude_1
    )

    longitude_difference = math.radians(
        longitude_2 - longitude_1
    )

    latitude_1_radians = math.radians(
        latitude_1
    )

    latitude_2_radians = math.radians(
        latitude_2
    )

    value = (
        math.sin(
            latitude_difference / 2
        ) ** 2
        +
        math.cos(
            latitude_1_radians
        )
        *
        math.cos(
            latitude_2_radians
        )
        *
        math.sin(
            longitude_difference / 2
        ) ** 2
    )

    angle = (
        2
        *
        math.atan2(
            math.sqrt(value),
            math.sqrt(1 - value)
        )
    )

    return (
        earth_radius_km
        *
        angle
    )


# =====================================
# HOME
# =====================================

@app.route("/")
def home():

    return jsonify({
        "status":
            "online",

        "service":
            "GPS Tracking API"
    })


# =====================================
# GET VEHICLES
# =====================================

@app.route(
    "/api/vehicles",
    methods=["GET"]
)
def get_vehicles():

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_code,
                    v.name,
                    v.vehicle_type,
                    v.status,
                    cp.latitude,
                    cp.longitude,
                    cp.speed,
                    cp.updated_at

                FROM vehicles v

                LEFT JOIN current_positions cp
                    ON v.id = cp.vehicle_id

                ORDER BY v.id
            """)

            vehicles = cursor.fetchall()

            return jsonify(
                vehicles
            )

    except Exception as error:

        app.logger.exception(
            "Vehicles could not be loaded"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# RECEIVE VEHICLE POSITION
# =====================================

@app.route(
    "/api/vehicles",
    methods=["POST"]
)
def receive_vehicle():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "status":
                "error",

            "message":
                "Request body is missing."
        }), 400

    required_fields = [
        "vehicle_id",
        "latitude",
        "longitude",
        "speed",
        "status",
        "vehicle_type"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in data
    ]

    if missing_fields:

        return jsonify({
            "status":
                "error",

            "message":
                "Missing fields: "
                +
                ", ".join(
                    missing_fields
                )
        }), 400

    vehicle_code = str(
        data["vehicle_id"]
    ).strip()

    try:

        latitude = float(
            data["latitude"]
        )

        longitude = float(
            data["longitude"]
        )

        speed = float(
            data["speed"]
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Latitude, longitude and speed "
                "must be valid numbers."
        }), 400

    status = str(
        data["status"]
    ).strip().lower()

    vehicle_type = str(
        data["vehicle_type"]
    ).strip().lower()

    allowed_statuses = {
        "active",
        "inactive"
    }

    allowed_vehicle_types = {
        "police",
        "ambulance",
        "fire"
    }

    if not vehicle_code:

        return jsonify({
            "status":
                "error",

            "message":
                "Vehicle id is required."
        }), 400

    if not -90 <= latitude <= 90:

        return jsonify({
            "status":
                "error",

            "message":
                "Latitude is invalid."
        }), 400

    if not -180 <= longitude <= 180:

        return jsonify({
            "status":
                "error",

            "message":
                "Longitude is invalid."
        }), 400

    if status not in allowed_statuses:

        return jsonify({
            "status":
                "error",

            "message":
                "Invalid vehicle status."
        }), 400

    if (
        vehicle_type
        not in allowed_vehicle_types
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Invalid vehicle type."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO vehicles (
                    vehicle_code,
                    vehicle_type,
                    status
                )
                VALUES (
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE
                    vehicle_type =
                        VALUES(vehicle_type),

                    status =
                        VALUES(status)
            """, (
                vehicle_code,
                vehicle_type,
                status
            ))

            cursor.execute("""
                SELECT id

                FROM vehicles

                WHERE vehicle_code = %s
            """, (
                vehicle_code,
            ))

            vehicle = cursor.fetchone()

            if not vehicle:

                raise RuntimeError(
                    "Vehicle could not be found "
                    "after insertion."
                )

            vehicle_id = vehicle["id"]

            cursor.execute("""
                INSERT INTO current_positions (
                    vehicle_id,
                    latitude,
                    longitude,
                    speed
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s
                )

                ON DUPLICATE KEY UPDATE
                    latitude =
                        VALUES(latitude),

                    longitude =
                        VALUES(longitude),

                    speed =
                        VALUES(speed),

                    updated_at =
                        CURRENT_TIMESTAMP
            """, (
                vehicle_id,
                latitude,
                longitude,
                speed
            ))

            cursor.execute("""
                INSERT INTO position_history (
                    vehicle_id,
                    latitude,
                    longitude,
                    speed
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                vehicle_id,
                latitude,
                longitude,
                speed
            ))

            connection.commit()

            return jsonify({
                "status":
                    "received",

                "vehicle_id":
                    vehicle_code
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Vehicle position could not be saved"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# CREATE INCIDENT
# =====================================

@app.route(
    "/api/incidents",
    methods=["POST"]
)
def create_incident():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "status":
                "error",

            "message":
                "Request body is missing."
        }), 400

    title = str(
        data.get(
            "title",
            ""
        )
    ).strip()

    incident_type = str(
        data.get(
            "incident_type",
            ""
        )
    ).strip().lower()

    required_vehicle_type = str(
        data.get(
            "required_vehicle_type",
            ""
        )
    ).strip().lower()

    priority = str(
        data.get(
            "priority",
            "medium"
        )
    ).strip().lower()

    details = str(
        data.get(
            "details",
            ""
        )
    ).strip()

    allowed_vehicle_types = {
        "police",
        "ambulance",
        "fire"
    }

    allowed_priorities = {
        "low",
        "medium",
        "high",
        "critical"
    }

    if not title:

        return jsonify({
            "status":
                "error",

            "message":
                "Situation name is required."
        }), 400

    if len(title) > 100:

        return jsonify({
            "status":
                "error",

            "message":
                "Situation name cannot exceed "
                "100 characters."
        }), 400

    if not incident_type:

        return jsonify({
            "status":
                "error",

            "message":
                "Incident type is required."
        }), 400

    if (
        required_vehicle_type
        not in allowed_vehicle_types
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Required vehicle type is invalid."
        }), 400

    if priority not in allowed_priorities:

        return jsonify({
            "status":
                "error",

            "message":
                "Priority is invalid."
        }), 400

    if len(details) > 1000:

        return jsonify({
            "status":
                "error",

            "message":
                "Details cannot exceed "
                "1000 characters."
        }), 400

    incident_code = (
        "INCIDENT-"
        +
        uuid.uuid4()
        .hex[:12]
        .upper()
    )

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                INSERT INTO incidents (
                    incident_code,
                    title,
                    incident_type,
                    required_vehicle_type,
                    priority,
                    details,
                    latitude,
                    longitude,
                    assigned_vehicle_id,
                    status
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    NULL,
                    NULL,
                    NULL,
                    'draft'
                )
            """, (
                incident_code,
                title,
                incident_type,
                required_vehicle_type,
                priority,
                details or None
            ))

            incident_id = (
                cursor.lastrowid
            )

            connection.commit()

            cursor.execute("""
                SELECT
                    id,
                    incident_code,
                    title,
                    incident_type,
                    required_vehicle_type,
                    priority,
                    details,
                    latitude,
                    longitude,
                    assigned_vehicle_id,
                    status,
                    created_at,
                    updated_at,
                    dispatched_at,
                    resolved_at

                FROM incidents

                WHERE id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            return jsonify({
                "status":
                    "created",

                "incident":
                    incident
            }), 201

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Incident could not be created"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# UPDATE INCIDENT LOCATION
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/location",
    methods=["PATCH"]
)
def update_incident_location(
    incident_id
):

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "status":
                "error",

            "message":
                "Request body is missing."
        }), 400

    try:

        latitude = float(
            data.get(
                "latitude"
            )
        )

        longitude = float(
            data.get(
                "longitude"
            )
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Latitude and longitude "
                "must be valid numbers."
        }), 400

    if not -90 <= latitude <= 90:

        return jsonify({
            "status":
                "error",

            "message":
                "Latitude is invalid."
        }), 400

    if not -180 <= longitude <= 180:

        return jsonify({
            "status":
                "error",

            "message":
                "Longitude is invalid."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    status

                FROM incidents

                WHERE id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if incident["status"] in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "The location cannot be "
                        "changed for this incident."
                }), 409

            cursor.execute("""
                UPDATE incidents

                SET
                    latitude = %s,
                    longitude = %s,
                    status = 'pending_dispatch'

                WHERE id = %s
            """, (
                latitude,
                longitude,
                incident_id
            ))

            connection.commit()

            cursor.execute("""
                SELECT
                    id,
                    incident_code,
                    title,
                    incident_type,
                    required_vehicle_type,
                    priority,
                    details,
                    latitude,
                    longitude,
                    assigned_vehicle_id,
                    status,
                    created_at,
                    updated_at,
                    dispatched_at,
                    resolved_at

                FROM incidents

                WHERE id = %s
            """, (
                incident_id,
            ))

            updated_incident = (
                cursor.fetchone()
            )

            return jsonify({
                "status":
                    "location_saved",

                "incident":
                    updated_incident
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Incident location could not be saved"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# RECOMMEND VEHICLE
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/recommended-vehicle",
    methods=["GET"]
)
def recommend_vehicle(
    incident_id
):

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    incident_code,
                    required_vehicle_type,
                    latitude,
                    longitude,
                    status

                FROM incidents

                WHERE id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if (
                incident["latitude"] is None
                or
                incident["longitude"] is None
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "The incident location "
                        "has not been selected."
                }), 409

            cursor.execute("""
                SELECT
                    v.id,
                    v.vehicle_code,
                    v.name,
                    v.vehicle_type,
                    v.status,
                    cp.latitude,
                    cp.longitude,
                    cp.speed,
                    cp.updated_at

                FROM vehicles v

                INNER JOIN current_positions cp
                    ON v.id = cp.vehicle_id

                WHERE
                    v.vehicle_type = %s

                    AND v.status = 'active'

                    AND cp.latitude
                        IS NOT NULL

                    AND cp.longitude
                        IS NOT NULL
            """, (
                incident[
                    "required_vehicle_type"
                ],
            ))

            eligible_vehicles = (
                cursor.fetchall()
            )

            if not eligible_vehicles:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "No active vehicle is available "
                        "for this incident type."
                }), 404

            incident_latitude = float(
                incident["latitude"]
            )

            incident_longitude = float(
                incident["longitude"]
            )

            nearest_vehicle = None

            shortest_distance = None

            for vehicle in eligible_vehicles:

                vehicle_latitude = float(
                    vehicle["latitude"]
                )

                vehicle_longitude = float(
                    vehicle["longitude"]
                )

                distance = (
                    calculate_haversine_distance(
                        vehicle_latitude,
                        vehicle_longitude,
                        incident_latitude,
                        incident_longitude
                    )
                )

                if (
                    shortest_distance is None
                    or
                    distance
                    <
                    shortest_distance
                ):

                    shortest_distance = (
                        distance
                    )

                    nearest_vehicle = (
                        vehicle
                    )

            return jsonify({
                "status":
                    "recommended",

                "incident_id":
                    incident_id,

                "vehicle":
                    nearest_vehicle,

                "distance_km":
                    round(
                        shortest_distance,
                        3
                    )
            }), 200

    except Exception as error:

        app.logger.exception(
            "Recommended vehicle could not be calculated"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# ASSIGN VEHICLE
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/assign",
    methods=["PATCH"]
)
def assign_vehicle(
    incident_id
):

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "status":
                "error",

            "message":
                "Request body is missing."
        }), 400

    vehicle_id = data.get(
        "vehicle_id"
    )

    try:

        vehicle_id = int(
            vehicle_id
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Vehicle id must be a valid integer."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    required_vehicle_type,
                    latitude,
                    longitude,
                    status

                FROM incidents

                WHERE id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if (
                incident["latitude"] is None
                or
                incident["longitude"] is None
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident location is missing."
                }), 409

            if incident["status"] in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "A vehicle cannot be assigned "
                        "to this incident."
                }), 409

            cursor.execute("""
                SELECT
                    id,
                    vehicle_code,
                    vehicle_type,
                    status

                FROM vehicles

                WHERE id = %s
            """, (
                vehicle_id,
            ))

            vehicle = cursor.fetchone()

            if not vehicle:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Vehicle was not found."
                }), 404

            if vehicle["status"] != "active":

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Vehicle is not active."
                }), 409

            if (
                vehicle["vehicle_type"]
                !=
                incident[
                    "required_vehicle_type"
                ]
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Vehicle type does not match "
                        "the incident requirements."
                }), 409

            cursor.execute("""
                UPDATE incidents

                SET
                    assigned_vehicle_id = %s,
                    status = 'assigned',
                    dispatched_at =
                        CURRENT_TIMESTAMP

                WHERE id = %s
            """, (
                vehicle_id,
                incident_id
            ))

            connection.commit()

            cursor.execute("""
                SELECT
                    i.id,
                    i.incident_code,
                    i.title,
                    i.incident_type,
                    i.required_vehicle_type,
                    i.priority,
                    i.details,
                    i.latitude,
                    i.longitude,
                    i.assigned_vehicle_id,
                    i.status,
                    i.created_at,
                    i.updated_at,
                    i.dispatched_at,
                    i.resolved_at,

                    v.vehicle_code
                        AS assigned_vehicle_code

                FROM incidents i

                LEFT JOIN vehicles v
                    ON i.assigned_vehicle_id =
                       v.id

                WHERE i.id = %s
            """, (
                incident_id,
            ))

            updated_incident = (
                cursor.fetchone()
            )

            return jsonify({
                "status":
                    "assigned",

                "incident":
                    updated_incident
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Vehicle could not be assigned"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# GET INCIDENT ROUTE
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/route",
    methods=["GET"]
)
def get_incident_route(
    incident_id
):

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    i.id,
                    i.incident_code,

                    i.latitude
                        AS incident_latitude,

                    i.longitude
                        AS incident_longitude,

                    i.assigned_vehicle_id,

                    i.status
                        AS incident_status,

                    v.vehicle_code,
                    v.vehicle_type,

                    v.status
                        AS vehicle_status,

                    cp.latitude
                        AS vehicle_latitude,

                    cp.longitude
                        AS vehicle_longitude

                FROM incidents i

                LEFT JOIN vehicles v
                    ON i.assigned_vehicle_id =
                       v.id

                LEFT JOIN current_positions cp
                    ON v.id = cp.vehicle_id

                WHERE i.id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if not incident[
                "assigned_vehicle_id"
            ]:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "No vehicle has been assigned "
                        "to this incident."
                }), 409

            if (
                incident[
                    "incident_latitude"
                ] is None
                or
                incident[
                    "incident_longitude"
                ] is None
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "The incident does not have "
                        "a valid location."
                }), 409

            if (
                incident[
                    "vehicle_latitude"
                ] is None
                or
                incident[
                    "vehicle_longitude"
                ] is None
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "The assigned vehicle does not "
                        "have a valid current position."
                }), 409

            vehicle_latitude = float(
                incident[
                    "vehicle_latitude"
                ]
            )

            vehicle_longitude = float(
                incident[
                    "vehicle_longitude"
                ]
            )

            incident_latitude = float(
                incident[
                    "incident_latitude"
                ]
            )

            incident_longitude = float(
                incident[
                    "incident_longitude"
                ]
            )

        route = (
            route_service.calculate_route(
                vehicle_latitude,
                vehicle_longitude,
                incident_latitude,
                incident_longitude
            )
        )

        return jsonify({
            "status":
                "route_ready",

            "incident_id":
                incident_id,

            "incident_code":
                incident[
                    "incident_code"
                ],

            "vehicle_id":
                incident[
                    "assigned_vehicle_id"
                ],

            "vehicle_code":
                incident[
                    "vehicle_code"
                ],

            "vehicle_type":
                incident[
                    "vehicle_type"
                ],

            **route
        }), 200

    except FileNotFoundError as error:

        app.logger.exception(
            "Road graph file was not found"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    except Exception as error:

        app.logger.exception(
            "Route calculation failed"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# GET ACTIVE ASSIGNMENT FOR VEHICLE
# =====================================

@app.route(
    "/api/vehicles/<string:vehicle_code>/active-assignment",
    methods=["GET"]
)
def get_vehicle_active_assignment(
    vehicle_code
):

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    v.id AS vehicle_id,
                    v.vehicle_code,
                    v.vehicle_type,

                    i.id AS incident_id,
                    i.incident_code,
                    i.title,
                    i.incident_type,
                    i.priority,
                    i.details,
                    i.latitude,
                    i.longitude,
                    i.status AS incident_status,
                    i.created_at,
                    i.dispatched_at

                FROM vehicles v

                LEFT JOIN incidents i
                    ON i.assigned_vehicle_id = v.id
                    AND i.status IN (
                        'assigned',
                        'in_progress'
                    )

                WHERE v.vehicle_code = %s

                ORDER BY i.dispatched_at DESC

                LIMIT 1
            """, (
                vehicle_code,
            ))

            result = cursor.fetchone()

            if not result:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Vehicle was not found."
                }), 404

            if not result["incident_id"]:

                return jsonify({
                    "status":
                        "ok",

                    "assigned":
                        False,

                    "vehicle_id":
                        result["vehicle_id"],

                    "vehicle_code":
                        result["vehicle_code"]
                }), 200

            return jsonify({
                "status":
                    "ok",

                "assigned":
                    True,

                "vehicle_id":
                    result["vehicle_id"],

                "vehicle_code":
                    result["vehicle_code"],

                "vehicle_type":
                    result["vehicle_type"],

                "incident": {

                    "id":
                        result["incident_id"],

                    "incident_code":
                        result["incident_code"],

                    "title":
                        result["title"],

                    "incident_type":
                        result["incident_type"],

                    "priority":
                        result["priority"],

                    "details":
                        result["details"],

                    "latitude":
                        float(
                            result["latitude"]
                        ),

                    "longitude":
                        float(
                            result["longitude"]
                        ),

                    "status":
                        result["incident_status"],

                    "created_at":
                        result["created_at"],

                    "dispatched_at":
                        result["dispatched_at"]
                }

            }), 200

    except Exception as error:

        app.logger.exception(
            "Vehicle assignment could not be loaded"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# MARK INCIDENT AS ARRIVED
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/arrived",
    methods=["PATCH"]
)
def mark_incident_arrived(
    incident_id
):

    data = request.get_json(
        silent=True
    ) or {}

    vehicle_code = str(
        data.get(
            "vehicle_code",
            ""
        )
    ).strip()

    if not vehicle_code:

        return jsonify({
            "status":
                "error",

            "message":
                "Vehicle code is required."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    i.id,
                    i.incident_code,
                    i.status,
                    i.assigned_vehicle_id,
                    v.vehicle_code

                FROM incidents i

                LEFT JOIN vehicles v
                    ON i.assigned_vehicle_id = v.id

                WHERE i.id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if (
                incident["vehicle_code"]
                !=
                vehicle_code
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "This vehicle is not assigned "
                        "to the incident."
                }), 409

            if incident["status"] == "resolved":

                return jsonify({
                    "status":
                        "already_resolved",

                    "incident_id":
                        incident_id,

                    "incident_code":
                        incident["incident_code"]
                }), 200

            if incident["status"] not in {
                "assigned",
                "in_progress"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "The incident is not currently active."
                }), 409

            cursor.execute("""
                UPDATE incidents

                SET
                    status = 'resolved',
                    resolved_at = CURRENT_TIMESTAMP

                WHERE id = %s
            """, (
                incident_id,
            ))

            connection.commit()

            return jsonify({
                "status":
                    "resolved",

                "incident_id":
                    incident_id,

                "incident_code":
                    incident["incident_code"],

                "vehicle_code":
                    vehicle_code
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Incident arrival could not be saved"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# GET INCIDENTS
# =====================================

@app.route(
    "/api/incidents",
    methods=["GET"]
)
def get_incidents():

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    i.id,
                    i.incident_code,
                    i.title,
                    i.incident_type,
                    i.required_vehicle_type,
                    i.priority,
                    i.details,
                    i.latitude,
                    i.longitude,
                    i.assigned_vehicle_id,
                    i.status,
                    i.created_at,
                    i.updated_at,
                    i.dispatched_at,
                    i.resolved_at,

                    v.vehicle_code
                        AS assigned_vehicle_code

                FROM incidents i

                LEFT JOIN vehicles v
                    ON i.assigned_vehicle_id =
                       v.id

                ORDER BY i.created_at DESC
            """)

            incidents = cursor.fetchall()

            return jsonify(
                incidents
            )

    except Exception as error:

        app.logger.exception(
            "Incidents could not be loaded"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()



# =====================================
# GET INCIDENT PDF REPORT
# =====================================

@app.route(
    "/api/incidents/<int:incident_id>/report",
    methods=["GET"]
)
def get_incident_report(
    incident_id
):

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    i.id,
                    i.incident_code,
                    i.title,
                    i.incident_type,
                    i.required_vehicle_type,
                    i.priority,
                    i.details,
                    i.latitude,
                    i.longitude,
                    i.assigned_vehicle_id,
                    i.status,
                    i.created_at,
                    i.updated_at,
                    i.dispatched_at,
                    i.resolved_at,

                    v.vehicle_code
                        AS assigned_vehicle_code,

                    v.vehicle_type
                        AS assigned_vehicle_type

                FROM incidents i

                LEFT JOIN vehicles v
                    ON i.assigned_vehicle_id =
                       v.id

                WHERE i.id = %s
            """, (
                incident_id,
            ))

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incident was not found."
                }), 404

            if incident["status"] not in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "A report can only be generated "
                        "for an archived incident."
                }), 409

            route_information = None

            if (
                incident["assigned_vehicle_id"]
                and
                incident["dispatched_at"]
                and
                incident["resolved_at"]
            ):

                cursor.execute("""
                    SELECT
                        latitude,
                        longitude,
                        recorded_at

                    FROM position_history

                    WHERE
                        vehicle_id = %s

                        AND recorded_at >= %s

                        AND recorded_at <= %s

                    ORDER BY recorded_at ASC
                """, (
                    incident[
                        "assigned_vehicle_id"
                    ],
                    incident[
                        "dispatched_at"
                    ],
                    incident[
                        "resolved_at"
                    ]
                ))

                route_points = cursor.fetchall()

                if route_points:

                    route_distance_km = 0.0

                    previous_point = None

                    for point in route_points:

                        if previous_point:

                            route_distance_km += (
                                calculate_haversine_distance(
                                    float(
                                        previous_point[
                                            "latitude"
                                        ]
                                    ),
                                    float(
                                        previous_point[
                                            "longitude"
                                        ]
                                    ),
                                    float(
                                        point[
                                            "latitude"
                                        ]
                                    ),
                                    float(
                                        point[
                                            "longitude"
                                        ]
                                    )
                                )
                            )

                        previous_point = point

                    first_point = route_points[0]

                    route_coordinates = []

                    for point in route_points:

                        route_coordinates.append({
                            "latitude":
                                float(
                                    point[
                                        "latitude"
                                    ]
                                ),

                            "longitude":
                                float(
                                    point[
                                        "longitude"
                                    ]
                                ),

                            "recorded_at":
                                (
                                    point[
                                        "recorded_at"
                                    ].isoformat()
                                    if point.get(
                                        "recorded_at"
                                    )
                                    else None
                                )
                        })

                    route_information = {
                        "distance_km":
                            round(
                                route_distance_km,
                                3
                            ),

                        "coordinate_count":
                            len(
                                route_points
                            ),

                        "start_latitude":
                            float(
                                first_point[
                                    "latitude"
                                ]
                            ),

                        "start_longitude":
                            float(
                                first_point[
                                    "longitude"
                                ]
                            ),

                        "end_latitude":
                            float(
                                route_points[-1][
                                    "latitude"
                                ]
                            ),

                        "end_longitude":
                            float(
                                route_points[-1][
                                    "longitude"
                                ]
                            ),

                        "incident_latitude":
                            (
                                float(
                                    incident[
                                        "latitude"
                                    ]
                                )
                                if incident[
                                    "latitude"
                                ] is not None
                                else None
                            ),

                        "incident_longitude":
                            (
                                float(
                                    incident[
                                        "longitude"
                                    ]
                                )
                                if incident[
                                    "longitude"
                                ] is not None
                                else None
                            ),

                        "coordinates":
                            route_coordinates
                    }

        pdf_bytes = (
            report_service.generate_report(
                incident,
                route_information
            )
        )

        filename = (
            f"{incident['incident_code']}"
            f"-report.pdf"
        )

        return Response(
            pdf_bytes,
            status=200,
            mimetype="application/pdf",
            headers={
                "Content-Disposition":
                    f'inline; filename="{filename}"'
            }
        )

    except Exception as error:

        app.logger.exception(
            "Incident report could not be generated"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# START SERVER
# =====================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )