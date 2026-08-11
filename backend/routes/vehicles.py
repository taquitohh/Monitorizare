from flask import (
    Blueprint,
    jsonify
)

from services.auth_service import AuthService


# =====================================
# BLUEPRINT
# =====================================

vehicles_bp = Blueprint(
    "vehicles",
    __name__
)


# =====================================
# VEHICLES ENDPOINT
# =====================================

@vehicles_bp.route(
    "/api/vehicles",
    methods=["GET"]
)
def get_vehicles():

    return jsonify({
        "message":
            "Vehicles endpoint"
    }), 200


# =====================================
# VEHICLES FOR SIMULATOR
# =====================================

@vehicles_bp.route(
    "/api/vehicles/simulator",
    methods=["GET"]
)
def get_simulator_vehicles():

    connection = (
        AuthService
        .get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    vehicle_code,
                    vehicle_type

                FROM
                    vehicles

                ORDER BY
                    id ASC
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
                    row.get(
                        "id"
                    ),

                "vehicle_code":
                    row.get(
                        "vehicle_code"
                    ),

                "vehicle_type":
                    row.get(
                        "vehicle_type"
                    )
            })


        return jsonify({
            "status":
                "success",

            "vehicle_count":
                len(
                    vehicles
                ),

            "vehicles":
                vehicles
        }), 200


    except Exception as error:

        print(
            "Vehiculele simulatorului "
            f"nu au putut fi citite: {error}"
        )


        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Vehiculele simulatorului "
                    "nu au putut fi citite."
                )
        }), 500


    finally:

        connection.close()