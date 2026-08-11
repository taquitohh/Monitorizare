from flask import (
    Blueprint,
    jsonify,
    request
)

from services.auth_service import AuthService
from services.specialist_service import SpecialistService
from services.incident_event_service import IncidentEventService


# =====================================
# BLUEPRINT
# =====================================

specialist_bp = Blueprint(
    "specialist",
    __name__
)


# =====================================
# UTILIZATOR AUTENTIFICAT
# =====================================

def get_authenticated_user():

    authorization = str(
        request.headers.get(
            "Authorization",
            ""
        )
        or
        ""
    ).strip()

    if not authorization.lower().startswith(
        "bearer "
    ):

        return None

    access_token = authorization[
        7:
    ].strip()

    if not access_token:

        return None

    return (
        AuthService
        .get_user_by_access_token(
            access_token
        )
    )


# =====================================
# VERIFICARE ACCES
# =====================================

def require_specialist_access():

    user = get_authenticated_user()

    if not user:

        return (
            None,
            jsonify({
                "status":
                    "error",

                "message":
                    "Autentificarea este obligatorie."
            }),
            401
        )

    role = str(
        user.get(
            "role",
            ""
        )
        or
        ""
    ).strip().lower()

    if role not in {
        "administrator",
        "dispatcher"
    }:

        return (
            None,
            jsonify({
                "status":
                    "error",

                "message":
                    "Nu ai permisiunea necesară."
            }),
            403
        )

    return (
        user,
        None,
        None
    )


# =====================================
# GET CHESTIONARE INCIDENT
# =====================================

@specialist_bp.route(
    "/api/incidents/<int:incident_id>/specialist-reports",
    methods=["GET"]
)
def get_incident_specialist_reports(
    incident_id
):

    (
        user,
        error_response,
        error_status
    ) = require_specialist_access()

    if error_response is not None:

        return (
            error_response,
            error_status
        )

    connection = (
        SpecialistService
        .get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            # =================================
            # VERIFICARE INCIDENT
            # =================================

            cursor.execute(
                """
                SELECT
                    id,
                    incident_code,
                    title,
                    status

                FROM incidents

                WHERE id = %s

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

            # =================================
            # CHESTIONARE
            # =================================

            reports = (
                SpecialistService
                .get_reports(
                    cursor,
                    incident_id
                )
            )

            # =================================
            # STARE COMPLETARE
            # =================================

            completion = (
                SpecialistService
                .all_reports_confirmed(
                    cursor,
                    incident_id
                )
            )

            return jsonify({
                "status":
                    "ok",

                "incident": {
                    "id":
                        incident["id"],

                    "incident_code":
                        incident[
                            "incident_code"
                        ],

                    "title":
                        incident[
                            "title"
                        ],

                    "status":
                        incident[
                            "status"
                        ]
                },

                "reports":
                    reports,

                "completion":
                    completion
            }), 200

    except Exception as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# AUTOSAVE RĂSPUNS
# =====================================

@specialist_bp.route(
    (
        "/api/specialist-reports/"
        "<int:report_id>/answers/"
        "<string:question_code>"
    ),
    methods=["PATCH"]
)
def save_specialist_answer(
    report_id,
    question_code
):

    (
        user,
        error_response,
        error_status
    ) = require_specialist_access()

    if error_response is not None:

        return (
            error_response,
            error_status
        )

    data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )

    if "value" not in data:

        return jsonify({
            "status":
                "error",

            "message":
                "Valoarea răspunsului lipsește."
        }), 400

    connection = (
        SpecialistService
        .get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            result = (
                SpecialistService
                .save_answer(
                    cursor,
                    report_id,
                    question_code,
                    data.get(
                        "value"
                    ),
                    changed_by_user_id=
                        user["id"]
                )
            )

        connection.commit()

        # =================================
        # EVENIMENT ISTORIC
        # =================================

        try:

            IncidentEventService \
                .specialist_answer_updated(
                    incident_id=
                        result[
                            "incident_id"
                        ],

                    report_id=
                        report_id,

                    service_type=
                        result[
                            "service_type"
                        ],

                    question_code=
                        question_code,

                    old_value=
                        result[
                            "previous_value"
                        ],

                    new_value=
                        result[
                            "answer_value"
                        ],

                    user_id=
                        user["id"]
                )

        except Exception as event_error:

            print(
                (
                    "Evenimentul pentru actualizarea "
                    "chestionarului nu a putut fi salvat:"
                ),
                event_error
            )

        return jsonify({
            "status":
                "saved",

            "answer":
                result
        }), 200

    except ValueError as error:

        connection.rollback()

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400

    except Exception as error:

        connection.rollback()

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# CONFIRMARE CHESTIONAR
# =====================================

@specialist_bp.route(
    (
        "/api/specialist-reports/"
        "<int:report_id>/confirm"
    ),
    methods=["PATCH"]
)
def confirm_specialist_report(
    report_id
):

    (
        user,
        error_response,
        error_status
    ) = require_specialist_access()

    if error_response is not None:

        return (
            error_response,
            error_status
        )

    connection = (
        SpecialistService
        .get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            # =================================
            # CONFIRMARE
            # =================================

            report = (
                SpecialistService
                .confirm_report(
                    cursor,
                    report_id,
                    confirmed_by_user_id=
                        user["id"]
                )
            )

            if not report:

                connection.rollback()

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Chestionarul nu a fost găsit."
                }), 404

            # =================================
            # STARE GENERALĂ INCIDENT
            # =================================

            completion = (
                SpecialistService
                .all_reports_confirmed(
                    cursor,
                    report[
                        "incident_id"
                    ]
                )
            )

        connection.commit()

        # =================================
        # EVENIMENT ISTORIC
        # =================================

        try:

            IncidentEventService \
                .specialist_report_confirmed(
                    incident_id=
                        report[
                            "incident_id"
                        ],

                    report_id=
                        report["id"],

                    service_type=
                        report[
                            "service_type"
                        ],

                    user_id=
                        user["id"]
                )

        except Exception as event_error:

            print(
                (
                    "Evenimentul pentru confirmarea "
                    "chestionarului nu a putut fi salvat:"
                ),
                event_error
            )

        return jsonify({
            "status":
                "confirmed",

            "report":
                report,

            "completion":
                completion
        }), 200

    except ValueError as error:

        connection.rollback()

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400

    except Exception as error:

        connection.rollback()

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()


# =====================================
# STATUS CHESTIONARE INCIDENT
# =====================================

@specialist_bp.route(
    (
        "/api/incidents/"
        "<int:incident_id>/"
        "specialist-reports/status"
    ),
    methods=["GET"]
)
def get_specialist_reports_status(
    incident_id
):

    (
        user,
        error_response,
        error_status
    ) = require_specialist_access()

    if error_response is not None:

        return (
            error_response,
            error_status
        )

    connection = (
        SpecialistService
        .get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            # =================================
            # VERIFICARE INCIDENT
            # =================================

            cursor.execute(
                """
                SELECT
                    id

                FROM incidents

                WHERE id = %s

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

            completion = (
                SpecialistService
                .all_reports_confirmed(
                    cursor,
                    incident_id
                )
            )

            return jsonify({
                "status":
                    "ok",

                "incident_id":
                    incident_id,

                "completion":
                    completion
            }), 200

    except Exception as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 500

    finally:

        connection.close()