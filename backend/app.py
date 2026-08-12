from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from routes.auth import auth_bp
from routes.driver import driver_bp
from routes.admin import admin_bp
from routes.specialist import specialist_bp

import os
import uuid

import pymysql

from services.route_service import RouteService
from services.report_service import IncidentReportService
from utils.validation import calculate_haversine_distance, validate_coordinates
from services.incident_service import IncidentService
from services.auth_service import AuthService
from services.specialist_service import SpecialistService

app = Flask(__name__)


app.config.update(
    SECRET_KEY=os.getenv(
        "SECRET_KEY",
        "cheie-locala-de-dezvoltare"
    ),

    SESSION_COOKIE_HTTPONLY=True,

    SESSION_COOKIE_SAMESITE="Lax",

    # Rămâne False cât timp folosim
    # http://localhost fără HTTPS.
    SESSION_COOKIE_SECURE=False,

    PERMANENT_SESSION_LIFETIME=3600
)

CORS(app)

app.register_blueprint(
    auth_bp
)
app.register_blueprint(
    driver_bp
)
app.register_blueprint(
    admin_bp
)
app.register_blueprint(
    specialist_bp
)
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
# GET VEHICLES FOR SIMULATOR
# =====================================

@app.route(
    "/api/vehicles/simulator",
    methods=["GET"]
)
def get_simulator_vehicles():

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    vehicle_code,
                    vehicle_type,
                    status

                FROM vehicles

                ORDER BY id ASC
                """
            )

            rows = (
                cursor.fetchall()
                or
                []
            )

            vehicles = []

            for row in rows:

                vehicles.append({
                    "id":
                        row["id"],

                    "vehicle_code":
                        row["vehicle_code"],

                    "vehicle_type":
                        row["vehicle_type"],

                    "status":
                        row["status"]
                })

            return jsonify({
                "status":
                    "success",

                "vehicle_count":
                    len(vehicles),

                "vehicles":
                    vehicles
            }), 200

    except Exception as error:

        app.logger.exception(
            "Vehiculele pentru simulator "
            "nu au putut fi încărcate"
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

    try:
        validate_coordinates(latitude, longitude)
    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
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
                        CASE

                            WHEN vehicles.status = 'busy'
                                THEN 'busy'

                            WHEN vehicles.status = 'inactive'
                                THEN 'inactive'

                            ELSE VALUES(status)

                        END
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
                "Corpul cererii lipsește."
        }), 400

    try:

        payload = (
            IncidentService
            .validate_incident_payload(
                data
            )
        )

    except ValueError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
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
                """,
                (
                    payload[
                        "incident_code"
                    ],

                    payload[
                        "title"
                    ],

                    payload[
                        "incident_type"
                    ],

                    payload[
                        "required_vehicle_type"
                    ],

                    payload[
                        "priority"
                    ],

                    (
                        payload["details"]
                        or
                        None
                    )
                )
            )

            incident_id = (
                cursor.lastrowid
            )

            category_rows = [
                (
                    incident_id,
                    incident_type
                )
                for incident_type
                in payload[
                    "incident_types"
                ]
            ]

            cursor.executemany(
                """
                INSERT INTO incident_categories (
                    incident_id,
                    category_code
                )
                VALUES (
                    %s,
                    %s
                )
                """,
                category_rows
            )

            requirement_rows = []

            for resource in payload[
                "required_resources"
            ]:

                requirement_rows.append(
                    (
                        incident_id,

                        resource[
                            "vehicle_type"
                        ],

                        resource[
                            "quantity"
                        ]
                    )
                )

            cursor.executemany(
                """
                INSERT INTO incident_requirements (
                    incident_id,
                    vehicle_type,
                    quantity
                )
                VALUES (
                    %s,
                    %s,
                    %s
                )
                """,
                requirement_rows
            )

            connection.commit()

            cursor.execute(
                """
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
                """,
                (
                    incident_id,
                )
            )

            incident = (
                cursor.fetchone()
            )

            cursor.execute(
                """
                SELECT
                    id,
                    vehicle_type,
                    quantity,
                    created_at,
                    updated_at

                FROM incident_requirements

                WHERE incident_id = %s

                ORDER BY
                    FIELD(
                        vehicle_type,
                        'police',
                        'ambulance',
                        'fire'
                    )
                """,
                (
                    incident_id,
                )
            )

            required_resources = (
                cursor.fetchall()
            )

            for resource in required_resources:

                resource["quantity"] = int(
                    resource["quantity"]
                )

            incident[
                "required_resources"
            ] = required_resources

            cursor.execute(
                """
                SELECT
                    category_code

                FROM incident_categories

                WHERE incident_id = %s

                ORDER BY id
                """,
                (
                    incident_id,
                )
            )

            incident_types = [
                row["category_code"]
                for row
                in cursor.fetchall()
            ]

            incident[
                "incident_types"
            ] = incident_types

            return jsonify({
                "status":
                    "created",

                "incident":
                    incident
            }), 201

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Incidentul nu a putut fi creat"
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

    try:
        validate_coordinates(latitude, longitude)
    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
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
# RECOMANDĂ VEHICULE
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

            cursor.execute(
                """
                SELECT
                    id,
                    incident_code,
                    latitude,
                    longitude,
                    status

                FROM incidents

                WHERE id = %s

                LIMIT 1
                """,
                (
                    incident_id,
                )
            )

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu a fost găsit."
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
                        "Locația incidentului nu a fost selectată."
                }), 409

            if incident["status"] in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu mai este activ."
                }), 409

            cursor.execute(
                """
                SELECT
                    vehicle_type,
                    quantity

                FROM incident_requirements

                WHERE incident_id = %s

                ORDER BY id
                """,
                (
                    incident_id,
                )
            )

            requirements = cursor.fetchall()

            if not requirements:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu are resurse configurate."
                }), 409

            incident_latitude = float(
                incident["latitude"]
            )

            incident_longitude = float(
                incident["longitude"]
            )

            recommended_vehicles = []

            missing_resources = []

            selected_vehicle_ids = set()

            for requirement in requirements:

                vehicle_type = str(
                    requirement[
                        "vehicle_type"
                    ]
                ).lower()

                quantity = int(
                    requirement[
                        "quantity"
                    ]
                )

                cursor.execute(
                    """
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
                        ON cp.vehicle_id = v.id

                    WHERE
                        v.vehicle_type = %s

                        AND v.status = 'active'

                        AND cp.latitude IS NOT NULL

                        AND cp.longitude IS NOT NULL

                    ORDER BY v.id
                    """,
                    (
                        vehicle_type,
                    )
                )

                available_vehicles = (
                    cursor.fetchall()
                )

                ranked_vehicles = []

                for vehicle in available_vehicles:

                    vehicle_id = int(
                        vehicle["id"]
                    )

                    if (
                        vehicle_id
                        in selected_vehicle_ids
                    ):

                        continue

                    distance_km = (
                        calculate_haversine_distance(
                            float(
                                vehicle["latitude"]
                            ),
                            float(
                                vehicle["longitude"]
                            ),
                            incident_latitude,
                            incident_longitude
                        )
                    )

                    vehicle[
                        "distance_km"
                    ] = round(
                        distance_km,
                        3
                    )

                    ranked_vehicles.append(
                        vehicle
                    )

                ranked_vehicles.sort(
                    key=lambda item:
                        item["distance_km"]
                )

                selected_for_type = (
                    ranked_vehicles[
                        :quantity
                    ]
                )

                for vehicle in selected_for_type:

                    selected_vehicle_ids.add(
                        int(
                            vehicle["id"]
                        )
                    )

                    recommended_vehicles.append(
                        vehicle
                    )

                missing_quantity = (
                    quantity
                    -
                    len(
                        selected_for_type
                    )
                )

                if missing_quantity > 0:

                    missing_resources.append({
                        "vehicle_type":
                            vehicle_type,

                        "requested_quantity":
                            quantity,

                        "available_quantity":
                            len(
                                selected_for_type
                            ),

                        "missing_quantity":
                            missing_quantity
                    })

            return jsonify({
                "status":
                    (
                        "recommended"
                        if not missing_resources
                        else "partially_recommended"
                    ),

                "incident_id":
                    incident_id,

                "incident_code":
                    incident[
                        "incident_code"
                    ],

                "vehicles":
                    recommended_vehicles,

                "missing_resources":
                    missing_resources,

                "complete":
                    len(
                        missing_resources
                    ) == 0
            }), 200

    except Exception as error:

        app.logger.exception(
            "Vehiculele recomandate nu au putut fi calculate"
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
# ASIGNEAZĂ VEHICULE
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
    ) or {}

    vehicle_ids = data.get(
        "vehicle_ids"
    )

    # Compatibilitate cu vechiul frontend.
    if vehicle_ids is None:

        legacy_vehicle_id = data.get(
            "vehicle_id"
        )

        if legacy_vehicle_id is not None:

            vehicle_ids = [
                legacy_vehicle_id
            ]

    if (
        not isinstance(
            vehicle_ids,
            list
        )
        or
        not vehicle_ids
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Trebuie selectat cel puțin un vehicul."
        }), 400

    normalized_vehicle_ids = []

    try:

        for vehicle_id in vehicle_ids:

            normalized_id = int(
                vehicle_id
            )

            if (
                normalized_id
                not in normalized_vehicle_ids
            ):

                normalized_vehicle_ids.append(
                    normalized_id
                )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Lista vehiculelor nu este validă."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    incident_code,
                    latitude,
                    longitude,
                    status

                FROM incidents

                WHERE id = %s

                FOR UPDATE
                """,
                (
                    incident_id,
                )
            )

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu a fost găsit."
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
                        "Locația incidentului lipsește."
                }), 409

            if incident["status"] in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Nu se mai pot asigna vehicule acestui incident."
                }), 409

            placeholders = ", ".join(
                [
                    "%s"
                    for _ in normalized_vehicle_ids
                ]
            )

            cursor.execute(
                f"""
                SELECT
                    id,
                    vehicle_code,
                    vehicle_type,
                    status

                FROM vehicles

                WHERE id IN (
                    {placeholders}
                )

                FOR UPDATE
                """,
                tuple(
                    normalized_vehicle_ids
                )
            )

            selected_vehicles = (
                cursor.fetchall()
            )

            if (
                len(selected_vehicles)
                !=
                len(normalized_vehicle_ids)
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Unul dintre vehicule nu a fost găsit."
                }), 404

            unavailable_vehicles = [
                vehicle[
                    "vehicle_code"
                ]
                for vehicle
                in selected_vehicles
                if vehicle["status"] != "active"
            ]

            if unavailable_vehicles:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Următoarele vehicule nu mai sunt "
                            "disponibile: "
                            +
                            ", ".join(
                                unavailable_vehicles
                            )
                        )
                }), 409

            cursor.execute(
                """
                SELECT
                    vehicle_type,
                    quantity

                FROM incident_requirements

                WHERE incident_id = %s
                """,
                (
                    incident_id,
                )
            )

            requirements = cursor.fetchall()

            required_quantities = {
                str(
                    requirement[
                        "vehicle_type"
                    ]
                ).lower():
                    int(
                        requirement[
                            "quantity"
                        ]
                    )

                for requirement
                in requirements
            }

            selected_quantities = {}

            for vehicle in selected_vehicles:

                vehicle_type = str(
                    vehicle[
                        "vehicle_type"
                    ]
                ).lower()

                selected_quantities[
                    vehicle_type
                ] = (
                    selected_quantities.get(
                        vehicle_type,
                        0
                    )
                    +
                    1
                )

            for (
                vehicle_type,
                required_quantity
            ) in required_quantities.items():

                selected_quantity = (
                    selected_quantities.get(
                        vehicle_type,
                        0
                    )
                )

                if (
                    selected_quantity
                    <
                    required_quantity
                ):

                    return jsonify({
                        "status":
                            "error",

                        "message":
                            (
                                "Nu au fost selectate suficiente "
                                f"vehicule de tip {vehicle_type}. "
                                f"Necesare: {required_quantity}, "
                                f"selectate: {selected_quantity}."
                            )
                    }), 409

            for (
                vehicle_type,
                selected_quantity
            ) in selected_quantities.items():

                allowed_quantity = (
                    required_quantities.get(
                        vehicle_type,
                        0
                    )
                )

                if (
                    selected_quantity
                    >
                    allowed_quantity
                ):

                    return jsonify({
                        "status":
                            "error",

                        "message":
                            (
                                "Au fost selectate prea multe "
                                f"vehicule de tip {vehicle_type}."
                            )
                    }), 409

            first_vehicle_id = (
                normalized_vehicle_ids[0]
            )

            cursor.execute(
                """
                DELETE FROM incident_assignments

                WHERE
                    incident_id = %s

                    AND status IN (
                        'assigned',
                        'in_progress'
                    )
                """,
                (
                    incident_id,
                )
            )

            assignment_rows = [
                (
                    incident_id,
                    vehicle_id,
                    "primary",
                    "assigned"
                )
                for vehicle_id
                in normalized_vehicle_ids
            ]

            cursor.executemany(
                """
                INSERT INTO incident_assignments (
                    incident_id,
                    vehicle_id,
                    assignment_type,
                    status
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                assignment_rows
            )

            cursor.execute(
                f"""
                UPDATE vehicles

                SET status = 'busy'

                WHERE id IN (
                    {placeholders}
                )
                """,
                tuple(
                    normalized_vehicle_ids
                )
            )

            cursor.execute(
                """
                UPDATE incidents

                SET
                    assigned_vehicle_id = %s,
                    status = 'assigned',
                    dispatched_at =
                        COALESCE(
                            dispatched_at,
                            CURRENT_TIMESTAMP
                        )

                WHERE id = %s
                """,
                (
                    first_vehicle_id,
                    incident_id
                )
            )

            SpecialistService.create_required_reports(
                cursor,
                incident_id
            )

         
            connection.commit()

            cursor.execute(
                """
                SELECT
                    ia.id AS assignment_id,
                    ia.assignment_type,
                    ia.status AS assignment_status,
                    ia.assigned_at,

                    v.id,
                    v.vehicle_code,
                    v.name,
                    v.vehicle_type,
                    v.status

                FROM incident_assignments ia

                INNER JOIN vehicles v
                    ON v.id = ia.vehicle_id

                WHERE
                    ia.incident_id = %s

                    AND ia.status IN (
                        'assigned',
                        'in_progress'
                    )

                ORDER BY ia.id
                """,
                (
                    incident_id,
                )
            )

            assignments = cursor.fetchall()

            return jsonify({
                "status":
                    "assigned",

                "message":
                    "Vehiculele au fost asignate.",

                "incident": {
                    "id":
                        incident_id,

                    "incident_code":
                        incident[
                            "incident_code"
                        ],

                    "status":
                        "assigned"
                },

                "assignments":
                    assignments
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Vehiculele nu au putut fi asignate"
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
# GET ALL INCIDENT ROUTES
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

            cursor.execute(
                """
                SELECT
                    id,
                    incident_code,
                    latitude,
                    longitude,
                    status

                FROM incidents

                WHERE id = %s

                LIMIT 1
                """,
                (
                    incident_id,
                )
            )

            incident = cursor.fetchone()

            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu a fost găsit."
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
                        "Incidentul nu are o locație validă."
                }), 409

            cursor.execute(
                """
                SELECT
                    ia.id AS assignment_id,
                    ia.assignment_type,
                    ia.status AS assignment_status,
                    ia.assigned_at,

                    v.id AS vehicle_id,
                    v.vehicle_code,
                    v.name AS vehicle_name,
                    v.vehicle_type,
                    v.status AS vehicle_status,

                    cp.latitude AS vehicle_latitude,
                    cp.longitude AS vehicle_longitude,
                    cp.speed AS vehicle_speed,
                    cp.updated_at AS position_updated_at

                FROM incident_assignments ia

                INNER JOIN vehicles v
                    ON v.id = ia.vehicle_id

                LEFT JOIN current_positions cp
                    ON cp.vehicle_id = v.id

                WHERE
                    ia.incident_id = %s

                    AND ia.status IN (
                        'assigned',
                        'in_progress'
                    )

                ORDER BY
                    FIELD(
                        v.vehicle_type,
                        'police',
                        'ambulance',
                        'fire'
                    ),
                    ia.assigned_at,
                    ia.id
                """,
                (
                    incident_id,
                )
            )

            assigned_vehicles = cursor.fetchall()

            if not assigned_vehicles:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu are vehicule active asignate."
                }), 409

            incident_latitude = float(
                incident["latitude"]
            )

            incident_longitude = float(
                incident["longitude"]
            )

        routes = []

        failed_routes = []

        for vehicle in assigned_vehicles:

            if (
                vehicle["vehicle_latitude"] is None
                or
                vehicle["vehicle_longitude"] is None
            ):

                failed_routes.append({
                    "vehicle_id":
                        vehicle["vehicle_id"],

                    "vehicle_code":
                        vehicle["vehicle_code"],

                    "vehicle_type":
                        vehicle["vehicle_type"],

                    "message":
                        "Vehiculul nu are o poziție GPS validă."
                })

                continue

            vehicle_latitude = float(
                vehicle["vehicle_latitude"]
            )

            vehicle_longitude = float(
                vehicle["vehicle_longitude"]
            )

            try:

                calculated_route = (
                    route_service.calculate_route(
                        vehicle_latitude,
                        vehicle_longitude,
                        incident_latitude,
                        incident_longitude
                    )
                )

                routes.append({
                    "assignment_id":
                        vehicle["assignment_id"],

                    "assignment_type":
                        vehicle["assignment_type"],

                    "assignment_status":
                        vehicle["assignment_status"],

                    "vehicle_id":
                        vehicle["vehicle_id"],

                    "vehicle_code":
                        vehicle["vehicle_code"],

                    "vehicle_name":
                        vehicle["vehicle_name"],

                    "vehicle_type":
                        vehicle["vehicle_type"],

                    "vehicle_status":
                        vehicle["vehicle_status"],

                    "vehicle_latitude":
                        vehicle_latitude,

                    "vehicle_longitude":
                        vehicle_longitude,

                    "vehicle_speed":
                        (
                            float(
                                vehicle["vehicle_speed"]
                            )
                            if vehicle["vehicle_speed"] is not None
                            else 0.0
                        ),

                    "position_updated_at":
                        vehicle["position_updated_at"],

                    **calculated_route
                })

            except Exception as route_error:

                app.logger.exception(
                    (
                        "Ruta nu a putut fi calculată "
                        f"pentru {vehicle['vehicle_code']}"
                    )
                )

                failed_routes.append({
                    "vehicle_id":
                        vehicle["vehicle_id"],

                    "vehicle_code":
                        vehicle["vehicle_code"],

                    "vehicle_type":
                        vehicle["vehicle_type"],

                    "message":
                        str(route_error)
                })

        if not routes:

            return jsonify({
                "status":
                    "error",

                "message":
                    (
                        "Nu a putut fi calculată ruta "
                        "niciunui vehicul asignat."
                    ),

                "incident_id":
                    incident_id,

                "incident_code":
                    incident["incident_code"],

                "failed_routes":
                    failed_routes
            }), 409

        response_data = {
            "status":
                (
                    "routes_ready"
                    if not failed_routes
                    else "routes_partially_ready"
                ),

            "incident_id":
                incident_id,

            "incident_code":
                incident["incident_code"],

            "incident_status":
                incident["status"],

            "incident_latitude":
                incident_latitude,

            "incident_longitude":
                incident_longitude,

            "route_count":
                len(routes),

            "routes":
                routes,

            "failed_routes":
                failed_routes
        }

        # Compatibilitate temporară cu eventuale funcții
        # care încă se așteaptă la o singură rută.
        first_route = routes[0]

        response_data.update({
            "vehicle_id":
                first_route["vehicle_id"],

            "vehicle_code":
                first_route["vehicle_code"],

            "vehicle_type":
                first_route["vehicle_type"],

            "coordinates":
                first_route.get(
                    "coordinates",
                    []
                ),

            "distance_km":
                first_route.get(
                    "distance_km"
                ),

            "estimated_duration_minutes":
                first_route.get(
                    "estimated_duration_minutes"
                )
        })

        return jsonify(
            response_data
        ), 200

    except FileNotFoundError as error:

        app.logger.exception(
            "Fișierul grafului rutier nu a fost găsit"
        )

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    except Exception as error:

        app.logger.exception(
            "Rutele incidentului nu au putut fi calculate"
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
# MISIUNEA ACTIVĂ A VEHICULULUI
# =====================================

@app.route(
    "/api/vehicles/<string:vehicle_code>/active-assignment",
    methods=["GET"]
)
def get_vehicle_active_assignment(
    vehicle_code
):

    vehicle_code = str(
        vehicle_code or ""
    ).strip()

    if not vehicle_code:

        return jsonify({
            "status":
                "error",

            "message":
                "Codul vehiculului este obligatoriu."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    v.id AS vehicle_id,
                    v.vehicle_code,
                    v.vehicle_type,
                    v.status AS vehicle_status,

                    ia.id AS assignment_id,
                    ia.assignment_type,
                    ia.status AS assignment_status,
                    ia.assigned_at,

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

                LEFT JOIN incident_assignments ia
                    ON ia.vehicle_id = v.id
                    AND ia.status IN (
                        'assigned',
                        'in_progress'
                    )

                LEFT JOIN incidents i
                    ON i.id = ia.incident_id
                    AND i.status IN (
                        'assigned',
                        'in_progress'
                    )

                WHERE v.vehicle_code = %s

                ORDER BY ia.assigned_at DESC

                LIMIT 1
                """,
                (
                    vehicle_code,
                )
            )

            result = cursor.fetchone()

            if not result:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Vehiculul nu a fost găsit."
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
                        result["vehicle_code"],

                    "vehicle_type":
                        result["vehicle_type"],

                    "vehicle_status":
                        result["vehicle_status"]
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

                "vehicle_status":
                    result["vehicle_status"],

                "assignment": {
                    "id":
                        result["assignment_id"],

                    "type":
                        result["assignment_type"],

                    "status":
                        result["assignment_status"],

                    "assigned_at":
                        result["assigned_at"]
                },

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
                        (
                            float(
                                result["latitude"]
                            )
                            if result["latitude"] is not None
                            else None
                        ),

                    "longitude":
                        (
                            float(
                                result["longitude"]
                            )
                            if result["longitude"] is not None
                            else None
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
            "Misiunea vehiculului nu a putut fi încărcată"
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
# MARCHEAZĂ SOSIREA UNUI VEHICUL
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
                "Codul vehiculului este obligatoriu."
        }), 400

    connection = get_db_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    i.id AS incident_id,
                    i.incident_code,
                    i.status AS incident_status,

                    v.id AS vehicle_id,
                    v.vehicle_code,
                    v.status AS vehicle_status,

                    ia.id AS assignment_id,
                    ia.status AS assignment_status

                FROM incidents i

                INNER JOIN incident_assignments ia
                    ON ia.incident_id = i.id

                INNER JOIN vehicles v
                    ON v.id = ia.vehicle_id

                WHERE
                    i.id = %s
                    AND v.vehicle_code = %s

                LIMIT 1

                FOR UPDATE
                """,
                (
                    incident_id,
                    vehicle_code
                )
            )

            assignment = cursor.fetchone()

            if not assignment:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Vehiculul nu este asignat "
                            "acestui incident."
                        )
                }), 404

            if assignment[
                "assignment_status"
            ] in {
                "arrived",
                "released"
            }:

                return jsonify({
                    "status":
                        "already_arrived",

                    "incident_id":
                        incident_id,

                    "incident_code":
                        assignment[
                            "incident_code"
                        ],

                    "vehicle_code":
                        vehicle_code,

                    "incident_resolved":
                        (
                            assignment[
                                "incident_status"
                            ]
                            ==
                            "resolved"
                        )
                }), 200

            if assignment[
                "assignment_status"
            ] not in {
                "assigned",
                "in_progress"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Asignarea vehiculului nu mai "
                            "este activă."
                        )
                }), 409

            cursor.execute(
                """
                UPDATE incident_assignments

                SET
                    status = 'arrived',
                    arrived_at = CURRENT_TIMESTAMP,
                    released_at = CURRENT_TIMESTAMP

                WHERE id = %s
                """,
                (
                    assignment[
                        "assignment_id"
                    ],
                )
            )

            cursor.execute(
                """
                UPDATE vehicles

                SET status = 'active'

                WHERE id = %s
                """,
                (
                    assignment[
                        "vehicle_id"
                    ],
                )
            )

            cursor.execute(
                """
                SELECT COUNT(*) AS active_assignments

                FROM incident_assignments

                WHERE
                    incident_id = %s

                    AND status IN (
                        'assigned',
                        'in_progress'
                    )
                """,
                (
                    incident_id,
                )
            )

            remaining_result = (
                cursor.fetchone()
            )

            active_assignments = int(
                remaining_result[
                    "active_assignments"
                ]
                or
                0
            )

            # =====================================
            # VERIFICARE CERERI DE ÎNTĂRIRI ACTIVE
            # =====================================

            cursor.execute(
                """
                SELECT COUNT(*) AS pending_reinforcement_requests

                FROM reinforcement_requests

                WHERE
                    incident_id = %s

                    AND status IN (
                        'pending',
                        'partially_assigned'
                    )
                """,
                (
                    incident_id,
                )
            )

            reinforcement_result = (
                cursor.fetchone()
            )

            pending_reinforcement_requests = int(
                reinforcement_result[
                    "pending_reinforcement_requests"
                ]
                or
                0
            )

            # Incidentul se închide doar dacă nu mai există
            # vehicule active și nici cereri de întăriri
            # care încă așteaptă o decizie / completare.
            incident_resolved = (
                active_assignments == 0
                and
                pending_reinforcement_requests == 0
            )

            if incident_resolved:

                cursor.execute(
                    """
                    UPDATE incidents

                    SET
                        status = 'resolved',
                        resolved_at =
                            CURRENT_TIMESTAMP

                    WHERE id = %s
                    """,
                    (
                        incident_id,
                    )
                )

            else:

                cursor.execute(
                    """
                    UPDATE incidents

                    SET
                        status = 'in_progress',
                        resolved_at = NULL

                    WHERE id = %s
                    """,
                    (
                        incident_id,
                    )
                )

            connection.commit()

            return jsonify({
                "status":
                    (
                        "resolved"
                        if incident_resolved
                        else "vehicle_arrived"
                    ),

                "incident_id":
                    incident_id,

                "incident_code":
                    assignment[
                        "incident_code"
                    ],

                "vehicle_code":
                    vehicle_code,

                "incident_resolved":
                    incident_resolved,

                "remaining_vehicles":
                    active_assignments
            }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Sosirea vehiculului nu a putut fi salvată"
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

            # =====================================
            # ÎNCĂRCARE INCIDENTE
            # =====================================

            cursor.execute(
                """
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
                    ON i.assigned_vehicle_id = v.id

                ORDER BY i.created_at DESC
                """
            )

            incidents = (
                cursor.fetchall()
            )


            # =====================================
            # ÎNCĂRCARE TOATE ASIGNĂRILE
            # =====================================

            cursor.execute(
                """
                SELECT
                    ia.id
                        AS assignment_id,

                    ia.incident_id,

                    ia.vehicle_id,

                    ia.assignment_type,

                    ia.status
                        AS assignment_status,

                    ia.assigned_at,

                    ia.arrived_at,

                    ia.released_at,

                    v.vehicle_code,

                    v.vehicle_type,

                    v.status
                        AS vehicle_status

                FROM incident_assignments ia

                INNER JOIN vehicles v
                    ON v.id = ia.vehicle_id

                ORDER BY
                    ia.incident_id ASC,
                    ia.id ASC
                """
            )

            assignments = (
                cursor.fetchall()
            )


            # =====================================
            # GRUPARE PE INCIDENT
            # =====================================

            assignments_by_incident = {}

            for assignment in assignments:

                incident_id = (
                    assignment[
                        "incident_id"
                    ]
                )

                if (
                    incident_id
                    not in
                    assignments_by_incident
                ):

                    assignments_by_incident[
                        incident_id
                    ] = []

                assignments_by_incident[
                    incident_id
                ].append({
                    "assignment_id":
                        assignment[
                            "assignment_id"
                        ],

                    "vehicle_id":
                        assignment[
                            "vehicle_id"
                        ],

                    "vehicle_code":
                        assignment[
                            "vehicle_code"
                        ],

                    "vehicle_type":
                        assignment[
                            "vehicle_type"
                        ],

                    "vehicle_status":
                        assignment[
                            "vehicle_status"
                        ],

                    "assignment_type":
                        assignment[
                            "assignment_type"
                        ],

                    "assignment_status":
                        assignment[
                            "assignment_status"
                        ],

                    "assigned_at":
                        assignment[
                            "assigned_at"
                        ],

                    "arrived_at":
                        assignment[
                            "arrived_at"
                        ],

                    "released_at":
                        assignment[
                            "released_at"
                        ]
                })


            # =====================================
            # ADĂUGARE ASIGNĂRI ÎN INCIDENTE
            # =====================================

            for incident in incidents:

                incident_id = (
                    incident[
                        "id"
                    ]
                )

                incident[
                    "assigned_vehicles"
                ] = (
                    assignments_by_incident.get(
                        incident_id,
                        []
                    )
                )

                incident[
                    "assigned_vehicle_count"
                ] = len(
                    incident[
                        "assigned_vehicles"
                    ]
                )


            return jsonify(
                incidents
            ), 200

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

    connection = (
        get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            # =====================================
            # INCIDENT
            # =====================================

            cursor.execute(
                """
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
                    i.resolved_at

                FROM incidents i

                WHERE i.id = %s

                LIMIT 1
                """,
                (
                    incident_id,
                )
            )

            incident = (
                cursor.fetchone()
            )


            if not incident:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Incidentul nu a fost găsit."
                }), 404


            # =====================================
            # RAPORT DOAR PENTRU INCIDENT ARHIVAT
            # =====================================

            if incident["status"] not in {
                "resolved",
                "cancelled"
            }:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Raportul poate fi generat "
                            "doar pentru un incident arhivat."
                        )
                }), 409


            # =====================================
            # COORDONATE INCIDENT
            # =====================================

            if (
                incident["latitude"]
                is not None
            ):

                incident["latitude"] = float(
                    incident["latitude"]
                )


            if (
                incident["longitude"]
                is not None
            ):

                incident["longitude"] = float(
                    incident["longitude"]
                )


            # =====================================
            # TIPURILE INCIDENTULUI
            # =====================================

            cursor.execute(
                """
                SELECT
                    id,
                    category_code

                FROM incident_categories

                WHERE incident_id = %s

                ORDER BY id ASC
                """,
                (
                    incident_id,
                )
            )

            incident_type_rows = (
                cursor.fetchall()
                or
                []
            )


            incident_types = [
                row["category_code"]
                for row
                in incident_type_rows
            ]

                        # Compatibilitate cu incidentele vechi,
            # care pot să nu aibă încă rânduri în
            # incident_categories.

            if (
                not incident_types
                and
                incident.get(
                    "incident_type"
                )
            ):

                incident_types = [
                    incident[
                        "incident_type"
                    ]
                ]


            incident[
                "incident_types"
            ] = incident_types


            # =====================================
            # RESURSE SOLICITATE INIȚIAL
            # =====================================

            cursor.execute(
                """
                SELECT
                    id,
                    vehicle_type,
                    quantity,
                    created_at,
                    updated_at

                FROM incident_requirements

                WHERE incident_id = %s

                ORDER BY
                    FIELD(
                        vehicle_type,
                        'police',
                        'ambulance',
                        'fire'
                    ),
                    id ASC
                """,
                (
                    incident_id,
                )
            )

            required_resources = (
                cursor.fetchall()
                or
                []
            )


            for resource in required_resources:

                resource["quantity"] = int(
                    resource.get(
                        "quantity"
                    )
                    or
                    0
                )


                        # Compatibilitate cu incidentele
            # create înainte de suportul pentru
            # resurse multiple.
            if (
                not required_resources
                and
                incident.get(
                    "required_vehicle_type"
                )
            ):

                required_resources = [
                    {
                        "vehicle_type":
                            incident[
                                "required_vehicle_type"
                            ],

                        "quantity":
                            1
                    }
                ]


            incident[
                "required_resources"
            ] = required_resources


            # =====================================
            # TOATE VEHICULELE IMPLICATE
            # =====================================

            cursor.execute(
                """
                SELECT
                    ia.id
                        AS assignment_id,

                    ia.incident_id,

                    ia.vehicle_id,

                    ia.assignment_type,

                    ia.status
                        AS assignment_status,

                    ia.assigned_at,

                    ia.arrived_at,

                    ia.released_at,

                    v.vehicle_code,

                    v.name
                        AS vehicle_name,

                    v.vehicle_type,

                    v.status
                        AS vehicle_status

                FROM incident_assignments ia

                INNER JOIN vehicles v
                    ON v.id = ia.vehicle_id

                WHERE
                    ia.incident_id = %s

                ORDER BY
                    FIELD(
                        v.vehicle_type,
                        'police',
                        'ambulance',
                        'fire'
                    ),

                    ia.assigned_at ASC,

                    ia.id ASC
                """,
                (
                    incident_id,
                )
            )

            assignments = (
                cursor.fetchall()
                or
                []
            )


            # =====================================
            # TRASEUL FIECĂRUI VEHICUL
            # =====================================

            vehicle_routes = []


            for assignment in assignments:

                assigned_at = (
                    assignment.get(
                        "assigned_at"
                    )
                )


                arrived_at = (
                    assignment.get(
                        "arrived_at"
                    )
                )


                released_at = (
                    assignment.get(
                        "released_at"
                    )
                )


                               # Ruta operațională reprezintă
                # deplasarea către incident.
                #
                # Ideal:
                # assigned_at -> arrived_at
                #
                # Dacă nu există arrived_at:
                # assigned_at -> released_at
                #
                # iar pentru cazurile vechi:
                # assigned_at -> resolved_at.

                route_start_at = (
                    assigned_at
                    or
                    incident.get(
                        "dispatched_at"
                    )
                )


                route_end_at = (
                    arrived_at
                    or
                    released_at
                    or
                    incident.get(
                        "resolved_at"
                    )
                )


                route_information = {

                    "assignment_id":
                        assignment[
                            "assignment_id"
                        ],

                    "vehicle_id":
                        assignment[
                            "vehicle_id"
                        ],

                    "vehicle_code":
                        assignment[
                            "vehicle_code"
                        ],

                    "vehicle_name":
                        assignment.get(
                            "vehicle_name"
                        ),

                    "vehicle_type":
                        assignment[
                            "vehicle_type"
                        ],

                    "assignment_type":
                        assignment[
                            "assignment_type"
                        ],

                    "assignment_status":
                        assignment[
                            "assignment_status"
                        ],

                    "assigned_at":
                        assigned_at,

                    "arrived_at":
                        arrived_at,

                    "released_at":
                        released_at,

                    "route_start_at":
                        route_start_at,

                    "route_end_at":
                        route_end_at,

                    "distance_km":
                        None,

                    "coordinate_count":
                        0,

                    "start_latitude":
                        None,

                    "start_longitude":
                        None,

                    "end_latitude":
                        None,

                    "end_longitude":
                        None,

                    "incident_latitude":
                        incident.get(
                            "latitude"
                        ),

                    "incident_longitude":
                        incident.get(
                            "longitude"
                        ),

                    "coordinates":
                        []
                }


                if (
                    route_start_at
                    and
                    route_end_at
                ):

                    cursor.execute(
                        """
                        SELECT
                            latitude,
                            longitude,
                            speed,
                            recorded_at

                        FROM position_history

                        WHERE
                            vehicle_id = %s

                            AND recorded_at >= %s

                            AND recorded_at <= %s

                        ORDER BY
                            recorded_at ASC
                        """,
                        (
                            assignment[
                                "vehicle_id"
                            ],
                            route_start_at,
                            route_end_at
                        )
                    )


                    route_points = (
                        cursor.fetchall()
                        or
                        []
                    )


                    if route_points:

                        route_distance_km = (
                            0.0
                        )


                        previous_point = None


                        route_coordinates = []


                        for point in route_points:

                            try:

                                point_latitude = float(
                                    point[
                                        "latitude"
                                    ]
                                )

                                point_longitude = float(
                                    point[
                                        "longitude"
                                    ]
                                )

                            except (
                                TypeError,
                                ValueError
                            ):

                                continue


                            if previous_point:

                                route_distance_km += (
                                    calculate_haversine_distance(
                                        previous_point[
                                            "latitude"
                                        ],
                                        previous_point[
                                            "longitude"
                                        ],
                                        point_latitude,
                                        point_longitude
                                    )
                                )


                            route_coordinates.append({
                                "latitude":
                                    point_latitude,

                                "longitude":
                                    point_longitude,

                                "speed":
                                    (
                                        float(
                                            point["speed"]
                                        )
                                        if point.get(
                                            "speed"
                                        )
                                        is not None
                                        else None
                                    ),

                                "recorded_at":
                                    point.get(
                                        "recorded_at"
                                    )
                            })


                            previous_point = {
                                "latitude":
                                    point_latitude,

                                "longitude":
                                    point_longitude
                            }


                        if route_coordinates:

                            first_point = (
                                route_coordinates[0]
                            )

                            last_point = (
                                route_coordinates[-1]
                            )


                            route_information[
                                "distance_km"
                            ] = round(
                                route_distance_km,
                                3
                            )


                            route_information[
                                "coordinate_count"
                            ] = len(
                                route_coordinates
                            )


                            route_information[
                                "start_latitude"
                            ] = first_point[
                                "latitude"
                            ]


                            route_information[
                                "start_longitude"
                            ] = first_point[
                                "longitude"
                            ]


                            route_information[
                                "end_latitude"
                            ] = last_point[
                                "latitude"
                            ]


                            route_information[
                                "end_longitude"
                            ] = last_point[
                                "longitude"
                            ]


                            route_information[
                                "coordinates"
                            ] = route_coordinates


                vehicle_routes.append(
                    route_information
                )


            # =====================================
            # LEAGĂ TRASEUL DE ASIGNARE
            # =====================================

            routes_by_assignment = {
                route[
                    "assignment_id"
                ]:
                    route

                for route
                in vehicle_routes
            }


            for assignment in assignments:

                assignment_route = (
                    routes_by_assignment.get(
                        assignment[
                            "assignment_id"
                        ]
                    )
                )


                assignment[
                    "route"
                ] = assignment_route


                if assignment_route:

                    assignment[
                        "distance_km"
                    ] = (
                        assignment_route.get(
                            "distance_km"
                        )
                    )

                    assignment[
                        "route_coordinate_count"
                    ] = (
                        assignment_route.get(
                            "coordinate_count"
                        )
                    )

                else:

                    assignment[
                        "distance_km"
                    ] = None

                    assignment[
                        "route_coordinate_count"
                    ] = 0


            incident[
                "assigned_vehicles"
            ] = assignments


            incident[
                "assigned_vehicle_count"
            ] = len(
                assignments
            )


            # =====================================
            # SUMAR VEHICULE PE SERVICIU
            # =====================================

            vehicle_summary = {

                "police": {
                    "total":
                        0,

                    "primary":
                        0,

                    "reinforcement":
                        0
                },

                "ambulance": {
                    "total":
                        0,

                    "primary":
                        0,

                    "reinforcement":
                        0
                },

                "fire": {
                    "total":
                        0,

                    "primary":
                        0,

                    "reinforcement":
                        0
                }

            }


            for assignment in assignments:

                vehicle_type = str(
                    assignment.get(
                        "vehicle_type"
                    )
                    or
                    ""
                ).lower()


                if (
                    vehicle_type
                    not in vehicle_summary
                ):

                    continue


                vehicle_summary[
                    vehicle_type
                ]["total"] += 1


                assignment_type = str(
                    assignment.get(
                        "assignment_type"
                    )
                    or
                    ""
                ).lower()


                if assignment_type in {
                    "primary",
                    "reinforcement"
                }:

                    vehicle_summary[
                        vehicle_type
                    ][
                        assignment_type
                    ] += 1


            # =====================================
            # STATISTICI DE RĂSPUNS
            # =====================================

            assignment_times = [
                assignment[
                    "assigned_at"
                ]

                for assignment
                in assignments

                if assignment.get(
                    "assigned_at"
                )
            ]


            arrival_times = [
                assignment[
                    "arrived_at"
                ]

                for assignment
                in assignments

                if assignment.get(
                    "arrived_at"
                )
            ]


            release_times = [
                assignment[
                    "released_at"
                ]

                for assignment
                in assignments

                if assignment.get(
                    "released_at"
                )
            ]


            first_assignment_at = (
                min(
                    assignment_times
                )
                if assignment_times
                else None
            )


            first_arrival_at = (
                min(
                    arrival_times
                )
                if arrival_times
                else None
            )


            last_arrival_at = (
                max(
                    arrival_times
                )
                if arrival_times
                else None
            )


            last_release_at = (
                max(
                    release_times
                )
                if release_times
                else None
            )


            dispatch_delay_seconds = None

            first_response_seconds = None

            total_incident_seconds = None


            if (
                incident.get(
                    "created_at"
                )
                and
                incident.get(
                    "dispatched_at"
                )
            ):

                dispatch_delay_seconds = max(
                    0,
                    int(
                        (
                            incident[
                                "dispatched_at"
                            ]
                            -
                            incident[
                                "created_at"
                            ]
                        ).total_seconds()
                    )
                )


            if (
                incident.get(
                    "dispatched_at"
                )
                and
                first_arrival_at
            ):

                first_response_seconds = max(
                    0,
                    int(
                        (
                            first_arrival_at
                            -
                            incident[
                                "dispatched_at"
                            ]
                        ).total_seconds()
                    )
                )


            if (
                incident.get(
                    "created_at"
                )
                and
                incident.get(
                    "resolved_at"
                )
            ):

                total_incident_seconds = max(
                    0,
                    int(
                        (
                            incident[
                                "resolved_at"
                            ]
                            -
                            incident[
                                "created_at"
                            ]
                        ).total_seconds()
                    )
                )


            operational_times = {

                "created_at":
                    incident.get(
                        "created_at"
                    ),

                "dispatched_at":
                    incident.get(
                        "dispatched_at"
                    ),

                "first_assignment_at":
                    first_assignment_at,

                "first_arrival_at":
                    first_arrival_at,

                "last_arrival_at":
                    last_arrival_at,

                "last_release_at":
                    last_release_at,

                "resolved_at":
                    incident.get(
                        "resolved_at"
                    ),

                "dispatch_delay_seconds":
                    dispatch_delay_seconds,

                "first_response_seconds":
                    first_response_seconds,

                "total_incident_seconds":
                    total_incident_seconds

            }


            # =====================================
            # DISTANȚĂ TOTALĂ ÎNREGISTRATĂ
            # =====================================

            total_recorded_distance_km = round(
                sum(
                    float(
                        route.get(
                            "distance_km"
                        )
                        or
                        0
                    )

                    for route
                    in vehicle_routes
                ),
                3
            )


            # =====================================
            # CERERI DE ÎNTĂRIRI
            # =====================================

            cursor.execute(
                """
                SELECT
                    rr.id,

                    rr.incident_id,

                    rr.requested_by_vehicle_id,

                    rr.requested_vehicle_type,

                    rr.requested_quantity,

                    rr.requested_message,

                    rr.assigned_quantity,

                    rr.status,

                    rr.failure_message,

                    rr.dispatcher_message,

                    rr.reviewed_by_user_id,

                    rr.reviewed_at,

                    rr.created_at,

                    rr.updated_at,

                    rr.completed_at,

                    requester.vehicle_code
                        AS requested_by_vehicle_code,

                    requester.name
                        AS requested_by_vehicle_name,

                    requester.vehicle_type
                        AS requested_by_vehicle_type_code,

                    reviewer.display_name
                        AS reviewed_by_display_name,

                    reviewer.role
                        AS reviewed_by_role

                FROM reinforcement_requests rr

                LEFT JOIN vehicles requester
                    ON requester.id =
                        rr.requested_by_vehicle_id

                LEFT JOIN users reviewer
                    ON reviewer.id =
                        rr.reviewed_by_user_id

                WHERE
                    rr.incident_id = %s

                ORDER BY
                    rr.created_at ASC,
                    rr.id ASC
                """,
                (
                    incident_id,
                )
            )


            reinforcement_requests = (
                cursor.fetchall()
                or
                []
            )


            # =====================================
            # RESURSELE CERERILOR DE ÎNTĂRIRI
            # =====================================

            for reinforcement_request in (
                reinforcement_requests
            ):

                cursor.execute(
                    """
                    SELECT
                        id,

                        reinforcement_request_id,

                        vehicle_type,

                        requested_quantity,

                        approved_quantity,

                        assigned_quantity,

                        created_at,

                        updated_at

                    FROM
                        reinforcement_request_resources

                    WHERE
                        reinforcement_request_id = %s

                    ORDER BY
                        FIELD(
                            vehicle_type,
                            'police',
                            'ambulance',
                            'fire'
                        ),
                        id ASC
                    """,
                    (
                        reinforcement_request[
                            "id"
                        ],
                    )
                )


                resources = (
                    cursor.fetchall()
                    or
                    []
                )


                for resource in resources:

                    resource[
                        "requested_quantity"
                    ] = int(
                        resource.get(
                            "requested_quantity"
                        )
                        or
                        0
                    )

                    resource[
                        "approved_quantity"
                    ] = int(
                        resource.get(
                            "approved_quantity"
                        )
                        or
                        0
                    )

                    resource[
                        "assigned_quantity"
                    ] = int(
                        resource.get(
                            "assigned_quantity"
                        )
                        or
                        0
                    )


                reinforcement_request[
                    "resources"
                ] = resources


                reinforcement_request[
                    "requested_quantity"
                ] = int(
                    reinforcement_request.get(
                        "requested_quantity"
                    )
                    or
                    0
                )


                reinforcement_request[
                    "assigned_quantity"
                ] = int(
                    reinforcement_request.get(
                        "assigned_quantity"
                    )
                    or
                    0
                )


            # =====================================
            # CHESTIONARE SPECIALIZATE
            # =====================================

            specialist_reports = (
                SpecialistService
                .get_reports(
                    cursor,
                    incident_id
                )
            )


            specialist_progress = (
                SpecialistService
                .all_reports_confirmed(
                    cursor,
                    incident_id
                )
            )


            # =====================================
            # ISTORIC RĂSPUNSURI CHESTIONARE
            # =====================================

            cursor.execute(
                """
                SELECT
                    h.id,

                    h.report_id,

                    h.question_code,

                    h.answer_value,

                    h.changed_by_user_id,

                    h.changed_at,

                    u.display_name
                        AS changed_by_display_name,

                    u.role
                        AS changed_by_role,

                    r.service_type

                FROM
                    incident_specialist_answer_history h

                INNER JOIN
                    incident_specialist_reports r

                    ON r.id =
                        h.report_id

                LEFT JOIN users u
                    ON u.id =
                        h.changed_by_user_id

                WHERE
                    r.incident_id = %s

                ORDER BY
                    h.changed_at ASC,
                    h.id ASC
                """,
                (
                    incident_id,
                )
            )


            specialist_answer_history = (
                cursor.fetchall()
                or
                []
            )


            # =====================================
            # CRONOLOGIA INCIDENTULUI
            # =====================================

            cursor.execute(
                """
                SELECT
                    ie.id,

                    ie.incident_id,

                    ie.event_type,

                    ie.source_type,

                    ie.source_id,

                    ie.service_type,

                    ie.message,

                    ie.metadata_json,

                    ie.created_by_user_id,

                    ie.created_at,

                    u.display_name
                        AS created_by_display_name,

                    u.role
                        AS created_by_role

                FROM incident_events ie

                LEFT JOIN users u
                    ON u.id =
                        ie.created_by_user_id

                WHERE
                    ie.incident_id = %s

                ORDER BY
                    ie.created_at ASC,
                    ie.id ASC
                """,
                (
                    incident_id,
                )
            )


            events = (
                cursor.fetchall()
                or
                []
            )


            # =====================================
            # SUMAR CERERI DE ÎNTĂRIRI
            # =====================================

            reinforcement_summary = {

                "total_requests":
                    len(
                        reinforcement_requests
                    ),

                "accepted":
                    0,

                "rejected":
                    0,

                "completed":
                    0,

                "failed":
                    0,

                "cancelled":
                    0,

                "pending":
                    0,

                "partially_assigned":
                    0,

                "requested_vehicles":
                    0,

                "approved_vehicles":
                    0,

                "assigned_vehicles":
                    0

            }


            for reinforcement_request in (
                reinforcement_requests
            ):

                request_status = str(
                    reinforcement_request.get(
                        "status"
                    )
                    or
                    ""
                ).lower()


                if (
                    request_status
                    in reinforcement_summary
                ):

                    reinforcement_summary[
                        request_status
                    ] += 1


                resources = (
                    reinforcement_request.get(
                        "resources"
                    )
                    or
                    []
                )


                if resources:

                    reinforcement_summary[
                        "requested_vehicles"
                    ] += sum(
                        int(
                            resource.get(
                                "requested_quantity"
                            )
                            or
                            0
                        )

                        for resource
                        in resources
                    )


                    reinforcement_summary[
                        "approved_vehicles"
                    ] += sum(
                        int(
                            resource.get(
                                "approved_quantity"
                            )
                            or
                            0
                        )

                        for resource
                        in resources
                    )


                    reinforcement_summary[
                        "assigned_vehicles"
                    ] += sum(
                        int(
                            resource.get(
                                "assigned_quantity"
                            )
                            or
                            0
                        )

                        for resource
                        in resources
                    )

                else:

                    reinforcement_summary[
                        "requested_vehicles"
                    ] += int(
                        reinforcement_request.get(
                            "requested_quantity"
                        )
                        or
                        0
                    )


                    reinforcement_summary[
                        "assigned_vehicles"
                    ] += int(
                        reinforcement_request.get(
                            "assigned_quantity"
                        )
                        or
                        0
                    )


            # =====================================
            # STATISTICI GENERALE
            # =====================================

            primary_vehicle_count = sum(
                1

                for assignment
                in assignments

                if str(
                    assignment.get(
                        "assignment_type"
                    )
                    or
                    ""
                ).lower()
                ==
                "primary"
            )


            reinforcement_vehicle_count = sum(
                1

                for assignment
                in assignments

                if str(
                    assignment.get(
                        "assignment_type"
                    )
                    or
                    ""
                ).lower()
                ==
                "reinforcement"
            )


            arrived_vehicle_count = sum(
                1

                for assignment
                in assignments

                if assignment.get(
                    "arrived_at"
                )
            )


            released_vehicle_count = sum(
                1

                for assignment
                in assignments

                if assignment.get(
                    "released_at"
                )
            )


            report_summary = {

                "vehicle_count":
                    len(
                        assignments
                    ),

                "primary_vehicle_count":
                    primary_vehicle_count,

                "reinforcement_vehicle_count":
                    reinforcement_vehicle_count,

                "arrived_vehicle_count":
                    arrived_vehicle_count,

                "released_vehicle_count":
                    released_vehicle_count,

                "route_count":
                    len(
                        [
                            route
                            for route
                            in vehicle_routes
                            if route.get(
                                "coordinate_count"
                            )
                        ]
                    ),

                "total_recorded_distance_km":
                    total_recorded_distance_km,

                "reinforcement_request_count":
                    len(
                        reinforcement_requests
                    ),

                "specialist_report_count":
                    len(
                        specialist_reports
                    ),

                "event_count":
                    len(
                        events
                    )

            }


            # =====================================
            # PACHET COMPLET PENTRU PDF
            # =====================================

            report_data = {

                "incident":
                    incident,

                "incident_types":
                    incident_types,

                "required_resources":
                    required_resources,

                "assignments":
                    assignments,

                "vehicle_summary":
                    vehicle_summary,

                "vehicle_routes":
                    vehicle_routes,

                "operational_times":
                    operational_times,

                "reinforcement_requests":
                    reinforcement_requests,

                "reinforcement_summary":
                    reinforcement_summary,

                "specialist_reports":
                    specialist_reports,

                "specialist_progress":
                    specialist_progress,

                "specialist_answer_history":
                    specialist_answer_history,

                "events":
                    events,

                "summary":
                    report_summary

            }


        # =====================================
        # GENERARE PDF
        # =====================================

        pdf_bytes = (
            report_service
            .generate_report(
                report_data
            )
        )


        # =====================================
        # NUME FIȘIER
        # =====================================

        filename = (
            f"{incident['incident_code']}"
            "-raport-final.pdf"
        )


        # =====================================
        # RESPONSE PDF
        # =====================================

        return Response(
            pdf_bytes,
            status=200,
            mimetype="application/pdf",
            headers={
                "Content-Disposition":
                    (
                        f'inline; '
                        f'filename="{filename}"'
                    )
            }
        )


    except Exception as error:

        app.logger.exception(
            (
                "Raportul incidentului "
                "nu a putut fi generat"
            )
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
# LISTĂ CERERI DE ÎNTĂRIRI
# =====================================

@app.route(
    "/api/reinforcement-requests",
    methods=["GET"]
)
def get_reinforcement_requests():

    current_user = (
        AuthService
        .get_user_from_authorization_header(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if not current_user:

        return jsonify({
            "status":
                "error",

            "message":
                "Utilizatorul nu este autentificat."
        }), 401

    if current_user["role"] not in (
        "administrator",
        "dispatcher"
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Accesul este permis doar "
                    "administratorilor și dispecerilor."
                )
        }), 403

    connection = (
        get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    rr.id,
                    rr.incident_id,
                    rr.requested_by_vehicle_id,
                    rr.requested_vehicle_type,
                    rr.requested_quantity,
                    rr.requested_message,
                    rr.assigned_quantity,
                    rr.status,
                    rr.failure_message,
                    rr.dispatcher_message,
                    rr.reviewed_by_user_id,
                    rr.reviewed_at,
                    rr.created_at,
                    rr.updated_at,
                    rr.completed_at,

                    i.incident_code,
                    i.title AS incident_title,
                    i.priority AS incident_priority,
                    i.status AS incident_status,
                    i.latitude AS incident_latitude,
                    i.longitude AS incident_longitude,

                    v.vehicle_code
                        AS requested_by_vehicle_code,

                    v.name
                        AS requested_by_vehicle_name,

                    v.vehicle_type
                        AS requested_by_vehicle_type_code,

                    v.status
                        AS requested_by_vehicle_status,

                    reviewer.display_name
                        AS reviewed_by_display_name

                FROM reinforcement_requests rr

                INNER JOIN incidents i
                    ON i.id = rr.incident_id

                INNER JOIN vehicles v
                    ON v.id = rr.requested_by_vehicle_id

                LEFT JOIN users reviewer
                    ON reviewer.id = rr.reviewed_by_user_id

                ORDER BY
                    FIELD(
                        rr.status,
                        'pending',
                        'partially_assigned',
                        'accepted',
                        'rejected',
                        'completed',
                        'cancelled',
                        'failed'
                    ),
                    rr.created_at DESC,
                    rr.id DESC
                """
            )

            reinforcement_requests = (
                cursor.fetchall()
            )

            for reinforcement_request in (
                reinforcement_requests
            ):

                cursor.execute(
                    """
                    SELECT
                        id,
                        reinforcement_request_id,
                        vehicle_type,
                        requested_quantity,
                        approved_quantity,
                        assigned_quantity,
                        created_at,
                        updated_at

                    FROM reinforcement_request_resources

                    WHERE reinforcement_request_id = %s

                    ORDER BY
                        FIELD(
                            vehicle_type,
                            'police',
                            'ambulance',
                            'fire'
                        ),
                        id
                    """,
                    (
                        reinforcement_request["id"],
                    )
                )

                reinforcement_request["resources"] = (
                    cursor.fetchall()
                )

        return jsonify({
            "status":
                "success",

            "requests":
                reinforcement_requests,

            "count":
                len(
                    reinforcement_requests
                )
        }), 200

    except Exception as error:

        app.logger.exception(
            (
                "Cererile de întăriri "
                "nu au putut fi încărcate."
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererile de întăriri nu au putut "
                    "fi încărcate."
                ),

            "details":
                str(error)
        }), 500

    finally:

        connection.close()


        # =====================================
# VALIDARE RESURSE ÎNTĂRIRI
# =====================================

def normalize_reinforcement_resources(
    raw_resources
):

    if not isinstance(
        raw_resources,
        dict
    ):

        raise ValueError(
            "Resursele aprobate nu sunt valide."
        )

    allowed_vehicle_types = (
        "police",
        "ambulance",
        "fire"
    )

    normalized_resources = {}

    for vehicle_type in allowed_vehicle_types:

        raw_quantity = (
            raw_resources.get(
                vehicle_type,
                0
            )
        )

        try:

            quantity = int(
                raw_quantity
            )

        except (
            TypeError,
            ValueError
        ):

            raise ValueError(
                (
                    "Cantitatea pentru "
                    f"{vehicle_type} nu este validă."
                )
            )

        if (
            quantity < 0
            or
            quantity > 20
        ):

            raise ValueError(
                (
                    "Cantitatea fiecărui tip de vehicul "
                    "trebuie să fie între 0 și 20."
                )
            )

        normalized_resources[
            vehicle_type
        ] = quantity

    if (
        sum(
            normalized_resources.values()
        )
        < 1
    ):

        raise ValueError(
            (
                "Pentru acceptarea cererii trebuie "
                "aprobat cel puțin un vehicul."
            )
        )

    return normalized_resources


# =====================================
# ACCEPTARE CERERE DE ÎNTĂRIRI
# =====================================

@app.route(
    "/api/reinforcement-requests/<int:request_id>/accept",
    methods=["POST"]
)
def accept_reinforcement_request(
    request_id
):

    current_user = (
        AuthService
        .get_user_from_authorization_header(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if not current_user:

        return jsonify({
            "status":
                "error",

            "message":
                "Utilizatorul nu este autentificat."
        }), 401

    if current_user["role"] not in (
        "administrator",
        "dispatcher"
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea poate fi analizată doar "
                    "de un administrator sau dispecer."
                )
        }), 403

    request_data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )

    dispatcher_message = str(
        request_data.get(
            "message"
        )
        or
        ""
    ).strip()

    if len(dispatcher_message) > 1000:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Mesajul dispecerului nu poate "
                    "depăși 1000 de caractere."
                )
        }), 400

    try:

        approved_resources = (
            normalize_reinforcement_resources(
                request_data.get(
                    "resources"
                )
            )
        )

    except ValueError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400

    connection = (
        get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            # =====================================
            # BLOCARE CERERE
            # =====================================

            cursor.execute(
                """
                SELECT
                    rr.id,
                    rr.incident_id,
                    rr.requested_by_vehicle_id,
                    rr.status,

                    i.incident_code,
                    i.title AS incident_title,
                    i.status AS incident_status,
                    i.latitude AS incident_latitude,
                    i.longitude AS incident_longitude

                FROM reinforcement_requests rr

                INNER JOIN incidents i
                    ON i.id = rr.incident_id

                WHERE rr.id = %s

                LIMIT 1

                FOR UPDATE
                """,
                (
                    request_id,
                )
            )

            reinforcement_request = (
                cursor.fetchone()
            )

            if not reinforcement_request:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Cererea de întăriri nu a fost găsită."
                }), 404

            if (
                reinforcement_request["status"]
                !=
                "pending"
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Cererea a fost deja analizată "
                            "sau nu mai este în așteptare."
                        )
                }), 409

            if (
                reinforcement_request[
                    "incident_status"
                ]
                not in (
                    "assigned",
                    "in_progress"
                )
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Incidentul asociat cererii "
                            "nu mai este activ."
                        )
                }), 409

            incident_latitude = (
                reinforcement_request[
                    "incident_latitude"
                ]
            )

            incident_longitude = (
                reinforcement_request[
                    "incident_longitude"
                ]
            )

            if (
                incident_latitude is None
                or
                incident_longitude is None
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Incidentul nu are o locație "
                            "GPS validă."
                        )
                }), 409

            incident_latitude = float(
                incident_latitude
            )

            incident_longitude = float(
                incident_longitude
            )

            total_approved_quantity = 0
            total_assigned_quantity = 0

            assigned_vehicles = []
            unavailable_resources = []

            # =====================================
            # PROCESARE FIECARE TIP
            # =====================================

            for (
                vehicle_type,
                approved_quantity
            ) in approved_resources.items():

                if approved_quantity < 1:

                    continue

                total_approved_quantity += (
                    approved_quantity
                )

                cursor.execute(
                    """
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
                        ON cp.vehicle_id = v.id

                    WHERE
                        v.vehicle_type = %s

                        AND v.status = 'active'

                        AND v.id != %s

                        AND NOT EXISTS (
                            SELECT 1

                            FROM incident_assignments existing_incident

                            WHERE
                                existing_incident.incident_id = %s

                                AND existing_incident.vehicle_id = v.id
                        )

                        AND NOT EXISTS (
                            SELECT 1

                            FROM incident_assignments active_assignment

                            INNER JOIN incidents active_incident
                                ON active_incident.id =
                                   active_assignment.incident_id

                            WHERE
                                active_assignment.vehicle_id = v.id

                                AND active_assignment.status IN (
                                    'assigned',
                                    'in_progress',
                                    'arrived'
                                )

                                AND active_incident.status IN (
                                    'assigned',
                                    'in_progress'
                                )
                        )

                    FOR UPDATE
                    """,
                    (
                        vehicle_type,
                        reinforcement_request[
                            "requested_by_vehicle_id"
                        ],
                        reinforcement_request[
                            "incident_id"
                        ]
                    )
                )

                candidate_vehicles = (
                    cursor.fetchall()
                )

                ranked_candidates = []

                for candidate in candidate_vehicles:

                    if (
                        candidate["latitude"] is None
                        or
                        candidate["longitude"] is None
                    ):

                        continue

                    distance_km = (
                        calculate_haversine_distance(
                            float(
                                candidate["latitude"]
                            ),
                            float(
                                candidate["longitude"]
                            ),
                            incident_latitude,
                            incident_longitude
                        )
                    )

                    ranked_candidates.append({
                        **candidate,

                        "distance_km":
                            float(
                                distance_km
                            )
                    })

                ranked_candidates.sort(
                    key=lambda candidate:
                        candidate["distance_km"]
                )

                selected_candidates = (
                    ranked_candidates[
                        :approved_quantity
                    ]
                )

                assigned_quantity = len(
                    selected_candidates
                )

                total_assigned_quantity += (
                    assigned_quantity
                )

                # =====================================
                # SALVARE RESURSĂ APROBATĂ
                # =====================================

                cursor.execute(
                    """
                    INSERT INTO reinforcement_request_resources (
                        reinforcement_request_id,
                        vehicle_type,
                        requested_quantity,
                        approved_quantity,
                        assigned_quantity
                    )
                    VALUES (
                        %s,
                        %s,
                        0,
                        %s,
                        %s
                    )

                    ON DUPLICATE KEY UPDATE
                        approved_quantity =
                            VALUES(approved_quantity),

                        assigned_quantity =
                            VALUES(assigned_quantity),

                        updated_at =
                            CURRENT_TIMESTAMP
                    """,
                    (
                        request_id,
                        vehicle_type,
                        approved_quantity,
                        assigned_quantity
                    )
                )

                if (
                    assigned_quantity
                    <
                    approved_quantity
                ):

                    unavailable_resources.append({
                        "vehicle_type":
                            vehicle_type,

                        "approved_quantity":
                            approved_quantity,

                        "assigned_quantity":
                            assigned_quantity,

                        "missing_quantity":
                            (
                                approved_quantity
                                -
                                assigned_quantity
                            )
                    })

                # =====================================
                # CREARE ASIGNĂRI
                # =====================================

                for vehicle in selected_candidates:

                    cursor.execute(
                        """
                        INSERT INTO incident_assignments (
                            incident_id,
                            vehicle_id,
                            assignment_type,
                            status
                        )
                        VALUES (
                            %s,
                            %s,
                            'reinforcement',
                            'assigned'
                        )
                        """,
                        (
                            reinforcement_request[
                                "incident_id"
                            ],
                            vehicle["id"]
                        )
                    )

                    cursor.execute(
                        """
                        UPDATE vehicles

                        SET status = 'busy'

                        WHERE id = %s
                        """,
                        (
                            vehicle["id"],
                        )
                    )

                    assigned_vehicles.append({
                        "id":
                            vehicle["id"],

                        "vehicle_code":
                            vehicle["vehicle_code"],

                        "name":
                            vehicle["name"],

                        "vehicle_type":
                            vehicle["vehicle_type"],

                        "distance_km":
                            round(
                                vehicle["distance_km"],
                                3
                            )
                    })

            # =====================================
            # STARE FINALĂ CERERE
            # =====================================

            if (
                total_assigned_quantity
                ==
                total_approved_quantity
            ):

                final_status = (
                    "accepted"
                )

                failure_message = (
                    None
                )

            elif total_assigned_quantity > 0:

                final_status = (
                    "partially_assigned"
                )

                failure_message = (
                    "Nu au fost disponibile toate "
                    "vehiculele aprobate."
                )

            else:

                final_status = (
                    "failed"
                )

                failure_message = (
                    "Nu au fost găsite vehicule "
                    "disponibile pentru întăriri."
                )

            cursor.execute(
                """
                UPDATE reinforcement_requests

                SET
                    assigned_quantity = %s,
                    status = %s,
                    failure_message = %s,
                    dispatcher_message = %s,
                    reviewed_by_user_id = %s,
                    reviewed_at = CURRENT_TIMESTAMP,

                    completed_at =
                        CASE
                            WHEN %s IN (
                                'accepted',
                                'partially_assigned',
                                'failed'
                            )
                            THEN CURRENT_TIMESTAMP
                            ELSE completed_at
                        END

                WHERE id = %s
                """,
                (
                    total_assigned_quantity,
                    final_status,
                    failure_message,
                    (
                        dispatcher_message
                        if dispatcher_message
                        else None
                    ),
                    current_user["id"],
                    final_status,
                    request_id
                )
            )

        connection.commit()

        return jsonify({
            "status":
                "success",

            "message":
                (
                    "Cererea a fost procesată, iar "
                    f"{total_assigned_quantity} vehicule "
                    "au fost asignate."
                ),

            "request_id":
                request_id,

            "request_status":
                final_status,

            "approved_quantity":
                total_approved_quantity,

            "assigned_quantity":
                total_assigned_quantity,

            "assigned_vehicles":
                assigned_vehicles,

            "unavailable_resources":
                unavailable_resources
        }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Cererea de întăriri nu a putut fi acceptată"
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea de întăriri nu a putut "
                    "fi acceptată."
                ),

            "details":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# RESPINGERE CERERE DE ÎNTĂRIRI
# =====================================

@app.route(
    "/api/reinforcement-requests/<int:request_id>/reject",
    methods=["POST"]
)
def reject_reinforcement_request(
    request_id
):

    current_user = (
        AuthService
        .get_user_from_authorization_header(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if not current_user:

        return jsonify({
            "status":
                "error",

            "message":
                "Utilizatorul nu este autentificat."
        }), 401

    if current_user["role"] not in (
        "administrator",
        "dispatcher"
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea poate fi analizată doar "
                    "de un administrator sau dispecer."
                )
        }), 403

    request_data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )

    dispatcher_message = str(
        request_data.get(
            "message"
        )
        or
        ""
    ).strip()

    if len(dispatcher_message) > 1000:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Mesajul dispecerului nu poate "
                    "depăși 1000 de caractere."
                )
        }), 400

    connection = (
        get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    status

                FROM reinforcement_requests

                WHERE id = %s

                LIMIT 1

                FOR UPDATE
                """,
                (
                    request_id,
                )
            )

            reinforcement_request = (
                cursor.fetchone()
            )

            if not reinforcement_request:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Cererea de întăriri nu a fost găsită."
                }), 404

            if (
                reinforcement_request["status"]
                !=
                "pending"
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Cererea a fost deja analizată "
                            "sau nu mai este în așteptare."
                        )
                }), 409

            cursor.execute(
                """
                UPDATE reinforcement_requests

                SET
                    status = 'rejected',
                    assigned_quantity = 0,
                    failure_message = NULL,
                    dispatcher_message = %s,
                    reviewed_by_user_id = %s,
                    reviewed_at = CURRENT_TIMESTAMP,
                    completed_at = CURRENT_TIMESTAMP

                WHERE id = %s
                """,
                (
                    (
                        dispatcher_message
                        if dispatcher_message
                        else None
                    ),
                    current_user["id"],
                    request_id
                )
            )

        connection.commit()

        return jsonify({
            "status":
                "success",

            "message":
                "Cererea de întăriri a fost respinsă.",

            "request_id":
                request_id,

            "request_status":
                "rejected"
        }), 200

    except Exception as error:

        connection.rollback()

        app.logger.exception(
            "Cererea de întăriri nu a putut fi respinsă"
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea de întăriri nu a putut "
                    "fi respinsă."
                ),

            "details":
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