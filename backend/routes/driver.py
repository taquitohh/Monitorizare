from flask import (
    Blueprint,
    jsonify,
    request,
)

from services.auth_service import (
    AuthService,
)


driver_bp = Blueprint(
    "driver",
    __name__
)


@driver_bp.route(
    "/api/driver/dashboard",
    methods=["GET"]
)
def get_driver_dashboard():

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

    if current_user["role"] != "driver":

        return jsonify({
            "status":
                "error",

            "message":
                "Accesul este permis doar șoferilor."
        }), 403

    try:

        dashboard = (
            AuthService
            .get_driver_dashboard(
                current_user["id"]
            )
        )

        if dashboard is None:

            return jsonify({
                "status":
                    "error",

                "message":
                    "Contul șoferului nu a fost găsit."
            }), 404

        return jsonify({
            "status":
                "success",

            **dashboard
        }), 200

    except PermissionError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 403

    except ValueError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400

    except Exception:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Datele șoferului nu au putut "
                    "fi încărcate."
                )
        }), 500