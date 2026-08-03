from flask import Blueprint


positions_bp = Blueprint(
    "positions",
    __name__
)


@positions_bp.route(
    "/api/positions",
    methods=["POST"]
)
def receive_position():

    return {
        "message": "Position endpoint"
    }