from flask import Blueprint


vehicles_bp = Blueprint(
    "vehicles",
    __name__
)


@vehicles_bp.route(
    "/api/vehicles",
    methods=["GET"]
)
def get_vehicles():

    return {
        "message": "Vehicles endpoint"
    }