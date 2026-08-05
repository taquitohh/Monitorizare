from flask import (
    Blueprint,
    jsonify,
    request,
)

from services.auth_service import (
    AuthService,
)


auth_bp = Blueprint(
    "auth",
    __name__
)


# =====================================
# AUTENTIFICARE
# =====================================

@auth_bp.route(
    "/api/auth/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    ) or {}

    username = data.get(
        "username",
        ""
    )

    password = data.get(
        "password",
        ""
    )

    user = (
        AuthService.authenticate(
            username,
            password
        )
    )

    if not user:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Numele de utilizator sau "
                    "parola sunt incorecte."
                )
        }), 401

    token_data = (
        AuthService.create_access_token(
            user["id"]
        )
    )

    return jsonify({
        "status":
            "success",

        "message":
            "Autentificarea a reușit.",

        "access_token":
            token_data["access_token"],

        "token_type":
            token_data["token_type"],

        "expires_in":
            token_data["expires_in"],

        "user":
            user
    }), 200


# =====================================
# DECONECTARE
# =====================================

@auth_bp.route(
    "/api/auth/logout",
    methods=["POST"]
)
def logout():

    access_token = (
        AuthService.extract_bearer_token(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if access_token:

        AuthService.revoke_access_token(
            access_token
        )

    return jsonify({
        "status":
            "success",

        "message":
            "Deconectarea a reușit."
    }), 200


# =====================================
# UTILIZATOR CURENT
# =====================================

@auth_bp.route(
    "/api/auth/me",
    methods=["GET"]
)
def get_current_user():

    user = (
        AuthService
        .get_user_from_authorization_header(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if not user:

        return jsonify({
            "authenticated":
                False,

            "message":
                "Utilizatorul nu este autentificat."
        }), 401

    return jsonify({
        "authenticated":
            True,

        "user":
            user
    }), 200