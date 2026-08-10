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


# =====================================
# DASHBOARD ȘOFER
# =====================================

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

    except Exception as error:

        print(
            (
                "Datele șoferului nu au putut "
                f"fi încărcate: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Datele șoferului nu au putut "
                    "fi încărcate."
                )
        }), 500


# =====================================
# TRIMITERE CERERE DE ÎNTĂRIRI
# =====================================

@driver_bp.route(
    "/api/driver/reinforcement-requests",
    methods=["POST"]
)
def create_driver_reinforcement_request():

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
                (
                    "Cererea de întăriri poate fi "
                    "trimisă doar de un șofer."
                )
        }), 403

    request_data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )

    requested_message = (
        request_data.get(
            "message"
        )
    )

    try:

        result = (
            AuthService
            .create_reinforcement_request(
                current_user["id"],
                requested_message
            )
        )

        
        return jsonify({
            "status":
                "success",

            "message":
                (
                    "Cererea de întăriri a fost "
                    "trimisă dispeceratului."
                ),

            **result
        }), 201

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

    except Exception as error:

        print(
            (
                "Cererea de întăriri nu a putut "
                f"fi trimisă: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea de întăriri nu a putut "
                    "fi trimisă."
                )
        }), 500


# =====================================
# ULTIMA CERERE DE ÎNTĂRIRI
# =====================================

@driver_bp.route(
    "/api/driver/reinforcement-requests/latest",
    methods=["GET"]
)
def get_latest_driver_reinforcement_request():

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
                (
                    "Cererea poate fi consultată "
                    "doar de un șofer."
                )
        }), 403

    try:

        reinforcement_request = (
            AuthService
            .get_latest_driver_reinforcement_request(
                current_user["id"]
            )
        )

        return jsonify({
            "status":
                "success",

            "request":
                reinforcement_request
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

    except Exception as error:

        print(
            (
                "Cererea de întăriri nu a putut "
                f"fi încărcată: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Cererea de întăriri nu a putut "
                    "fi încărcată."
                )
        }), 500

        # =====================================
# ISTORIC CERERI DE ÎNTĂRIRI
# =====================================

@driver_bp.route(
    "/api/driver/reinforcement-requests/history",
    methods=["GET"]
)
def get_driver_reinforcement_request_history():

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
                (
                    "Istoricul cererilor poate fi "
                    "consultat doar de un șofer."
                )
        }), 403

    try:

        reinforcement_requests = (
            AuthService
            .get_driver_reinforcement_request_history(
                current_user["id"]
            )
        )

        return jsonify({
            "status":
                "success",

            "requests":
                reinforcement_requests
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

    except Exception as error:

        print(
            (
                "Istoricul cererilor de întăriri "
                f"nu a putut fi încărcat: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Istoricul cererilor de întăriri "
                    "nu a putut fi încărcat."
                )
        }), 500