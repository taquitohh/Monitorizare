from flask import (
    Blueprint,
    jsonify,
    request,
)

from werkzeug.security import (
    generate_password_hash,
)

from services.auth_service import (
    AuthService,
)

import re


admin_bp = Blueprint(
    "admin",
    __name__
)


# =====================================
# CONFIGURARE
# =====================================

ALLOWED_ROLES = {
    "administrator",
    "dispatcher",
    "driver",
}

ALLOWED_VEHICLE_TYPES = {
    "police",
    "ambulance",
    "fire",
}

READ_ONLY_SQL_COMMANDS = {
    "select",
    "show",
    "describe",
    "desc",
    "explain",
}

WRITE_SQL_COMMANDS = {
    "insert",
    "update",
    "delete",
    "replace",
    "create",
    "alter",
    "drop",
    "truncate",
    "rename",
}

BLOCKED_SQL_COMMANDS = {
    "grant",
    "revoke",
    "shutdown",
    "kill",
    "use",
    "set",
    "start",
    "commit",
    "rollback",
    "lock",
    "unlock",
}

DEFAULT_TABLE_LIMIT = 100
MAX_TABLE_LIMIT = 500
MAX_SQL_ROWS = 1000


# =====================================
# AUTENTIFICARE ADMINISTRATOR
# =====================================

def get_current_administrator():

    current_user = (
        AuthService
        .get_user_from_authorization_header(
            request.headers.get(
                "Authorization"
            )
        )
    )

    if not current_user:

        return None, (
            jsonify({
                "status":
                    "error",

                "message":
                    "Utilizatorul nu este autentificat."
            }),
            401
        )

    if (
        current_user.get("role")
        !=
        "administrator"
    ):

        return None, (
            jsonify({
                "status":
                    "error",

                "message":
                    (
                        "Această operație este permisă "
                        "doar administratorilor."
                    )
            }),
            403
        )

    return current_user, None


# =====================================
# SERIALIZARE DB
# =====================================

def serialize_database_value(
    value
):

    if value is None:

        return None

    if hasattr(
        value,
        "isoformat"
    ):

        return value.isoformat()

    if isinstance(
        value,
        bytes
    ):

        return value.hex()

    return value


def serialize_database_row(
    row
):

    if row is None:

        return None

    return {
        key:
            serialize_database_value(
                value
            )

        for key, value
        in row.items()
    }


def serialize_database_rows(
    rows
):

    return [
        serialize_database_row(
            row
        )
        for row
        in rows
    ]


# =====================================
# IDENTIFICATOR SQL
# =====================================

def validate_sql_identifier(
    identifier
):

    identifier = str(
        identifier
        or
        ""
    ).strip()

    if not identifier:

        raise ValueError(
            "Identificatorul bazei de date lipsește."
        )

    if not re.fullmatch(
        r"[A-Za-z0-9_]+",
        identifier
    ):

        raise ValueError(
            "Identificatorul bazei de date nu este valid."
        )

    return identifier


# =====================================
# EXISTENȚĂ TABEL
# =====================================

def database_table_exists(
    cursor,
    table_name
):

    cursor.execute(
        """
        SELECT
            COUNT(*) AS total

        FROM information_schema.tables

        WHERE
            table_schema = DATABASE()
            AND table_name = %s
        """,
        (
            table_name,
        )
    )

    result = (
        cursor.fetchone()
        or
        {}
    )

    return (
        int(
            result.get(
                "total",
                0
            )
            or
            0
        )
        > 0
    )


# =====================================
# SQL - O SINGURĂ INSTRUCȚIUNE
# =====================================

def normalize_sql_statement(
    sql
):

    sql = str(
        sql
        or
        ""
    ).strip()

    if not sql:

        raise ValueError(
            "Interogarea SQL este goală."
        )

    while sql.endswith(";"):

        sql = sql[:-1].rstrip()

    if not sql:

        raise ValueError(
            "Interogarea SQL este goală."
        )

    if ";" in sql:

        raise ValueError(
            (
                "Poate fi executată o singură "
                "instrucțiune SQL odată."
            )
        )

    return sql


def get_sql_command(
    sql
):

    cleaned_sql = re.sub(
        r"^\s*(?:--[^\n]*\n\s*)*",
        "",
        sql,
        flags=re.MULTILINE
    ).strip()

    match = re.match(
        r"([A-Za-z]+)",
        cleaned_sql
    )

    if not match:

        raise ValueError(
            "Comanda SQL nu a putut fi identificată."
        )

    return (
        match.group(1)
        .lower()
    )


# =====================================
# GENERARE NUMĂR ȘOFER / VEHICUL
# =====================================

def get_next_driver_number(
    cursor
):

    cursor.execute(
        """
        SELECT
            username

        FROM users

        WHERE username LIKE 'sofer-%'
        """
    )

    users = (
        cursor.fetchall()
        or
        []
    )

    cursor.execute(
        """
        SELECT
            vehicle_code

        FROM vehicles

        WHERE vehicle_code LIKE 'VEHICLE-%'
        """
    )

    vehicles = (
        cursor.fetchall()
        or
        []
    )

    used_numbers = set()


    for user in users:

        username = str(
            user.get(
                "username"
            )
            or
            ""
        ).strip().lower()

        match = re.fullmatch(
            r"sofer-(\d+)",
            username
        )

        if match:

            used_numbers.add(
                int(
                    match.group(1)
                )
            )


    for vehicle in vehicles:

        vehicle_code = str(
            vehicle.get(
                "vehicle_code"
            )
            or
            ""
        ).strip().upper()

        match = re.fullmatch(
            r"VEHICLE-(\d+)",
            vehicle_code
        )

        if match:

            used_numbers.add(
                int(
                    match.group(1)
                )
            )


    next_number = 1

    while next_number in used_numbers:

        next_number += 1


    if next_number > 999:

        raise RuntimeError(
            (
                "Nu mai există identificatori disponibili "
                "în formatul sofer-001 ... sofer-999."
            )
        )


    return next_number


# =====================================
# DASHBOARD ADMIN
# =====================================

@admin_bp.route(
    "/api/admin/dashboard",
    methods=["GET"]
)
def get_admin_dashboard():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            # =====================================
            # UTILIZATORI
            # =====================================

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_users,

                    COALESCE(
                        SUM(
                            role = 'administrator'
                        ),
                        0
                    ) AS administrators,

                    COALESCE(
                        SUM(
                            role = 'dispatcher'
                        ),
                        0
                    ) AS dispatchers,

                    COALESCE(
                        SUM(
                            role = 'driver'
                        ),
                        0
                    ) AS drivers,

                    COALESCE(
                        SUM(
                            is_active = TRUE
                        ),
                        0
                    ) AS active_users

                FROM users
                """
            )

            user_statistics = (
                cursor.fetchone()
                or
                {}
            )


            # =====================================
            # VEHICULE
            # =====================================

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_vehicles,

                    COALESCE(
                        SUM(
                            vehicle_type = 'police'
                        ),
                        0
                    ) AS police_vehicles,

                    COALESCE(
                        SUM(
                            vehicle_type = 'ambulance'
                        ),
                        0
                    ) AS ambulance_vehicles,

                    COALESCE(
                        SUM(
                            vehicle_type = 'fire'
                        ),
                        0
                    ) AS fire_vehicles,

                    COALESCE(
                        SUM(
                            status = 'active'
                        ),
                        0
                    ) AS active_vehicles,

                    COALESCE(
                        SUM(
                            status = 'busy'
                        ),
                        0
                    ) AS busy_vehicles,

                    COALESCE(
                        SUM(
                            status = 'inactive'
                        ),
                        0
                    ) AS inactive_vehicles

                FROM vehicles
                """
            )

            vehicle_statistics = (
                cursor.fetchone()
                or
                {}
            )


            # =====================================
            # INCIDENTE
            # =====================================

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_incidents,

                    COALESCE(
                        SUM(
                            status IN (
                                'pending',
                                'assigned',
                                'in_progress'
                            )
                        ),
                        0
                    ) AS active_incidents,

                    COALESCE(
                        SUM(
                            status = 'resolved'
                        ),
                        0
                    ) AS resolved_incidents

                FROM incidents
                """
            )

            incident_statistics = (
                cursor.fetchone()
                or
                {}
            )


            # =====================================
            # CERERI ÎNTĂRIRI
            # =====================================

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_requests,

                    COALESCE(
                        SUM(
                            status IN (
                                'pending',
                                'partially_assigned',
                                'accepted'
                            )
                        ),
                        0
                    ) AS active_requests,

                    COALESCE(
                        SUM(
                            status = 'pending'
                        ),
                        0
                    ) AS pending_requests,

                    COALESCE(
                        SUM(
                            status = 'rejected'
                        ),
                        0
                    ) AS rejected_requests,

                    COALESCE(
                        SUM(
                            status = 'completed'
                        ),
                        0
                    ) AS completed_requests

                FROM reinforcement_requests
                """
            )

            request_statistics = (
                cursor.fetchone()
                or
                {}
            )


            return jsonify({
                "status":
                    "success",

                "user":
                    current_user,

                "statistics": {
                    "users":
                        serialize_database_row(
                            user_statistics
                        ),

                    "vehicles":
                        serialize_database_row(
                            vehicle_statistics
                        ),

                    "incidents":
                        serialize_database_row(
                            incident_statistics
                        ),

                    "reinforcement_requests":
                        serialize_database_row(
                            request_statistics
                        )
                }
            }), 200


    except Exception as error:

        print(
            (
                "Dashboard-ul administratorului "
                f"nu a putut fi încărcat: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Dashboard-ul administratorului "
                    "nu a putut fi încărcat."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# LISTĂ UTILIZATORI
# =====================================

@admin_bp.route(
    "/api/admin/users",
    methods=["GET"]
)
def get_admin_users():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    username,
                    display_name,
                    role,
                    is_active,
                    created_at,
                    updated_at

                FROM users

                ORDER BY
                    role ASC,
                    username ASC
                """
            )

            users = (
                cursor.fetchall()
                or
                []
            )


            return jsonify({
                "status":
                    "success",

                "users":
                    serialize_database_rows(
                        users
                    )
            }), 200


    except Exception as error:

        print(
            (
                "Utilizatorii nu au putut "
                f"fi încărcați: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Utilizatorii nu au putut "
                    "fi încărcați."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# CREARE UTILIZATOR
# =====================================

@admin_bp.route(
    "/api/admin/users",
    methods=["POST"]
)
def create_admin_user():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )


    role = str(
        data.get(
            "role"
        )
        or
        ""
    ).strip().lower()


    display_name = str(
        data.get(
            "display_name"
        )
        or
        ""
    ).strip()


    password = str(
        data.get(
            "password"
        )
        or
        ""
    )


    requested_username = str(
        data.get(
            "username"
        )
        or
        ""
    ).strip()


    vehicle_type = str(
        data.get(
            "vehicle_type"
        )
        or
        ""
    ).strip().lower()


    vehicle_name = str(
        data.get(
            "vehicle_name"
        )
        or
        ""
    ).strip()


    # =====================================
    # VALIDARE GENERALĂ
    # =====================================

    if (
        role
        not in
        ALLOWED_ROLES
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Rolul utilizatorului nu este valid."
        }), 400


    if not display_name:

        return jsonify({
            "status":
                "error",

            "message":
                "Numele afișat este obligatoriu."
        }), 400


    if len(display_name) > 100:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Numele afișat nu poate depăși "
                    "100 de caractere."
                )
        }), 400


    if len(password) < 8:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Parola trebuie să conțină "
                    "cel puțin 8 caractere."
                )
        }), 400


    if (
        role == "driver"
        and
        vehicle_type
        not in
        ALLOWED_VEHICLE_TYPES
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Pentru șofer trebuie selectat "
                    "tipul vehiculului."
                )
        }), 400


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            # =====================================
            # CREARE ȘOFER + VEHICUL
            # =====================================

            if role == "driver":

                driver_number = (
                    get_next_driver_number(
                        cursor
                    )
                )


                username = (
                    f"sofer-{driver_number:03d}"
                )


                vehicle_code = (
                    f"VEHICLE-{driver_number:03d}"
                )


                cursor.execute(
                    """
                    SELECT
                        id

                    FROM users

                    WHERE username = %s

                    LIMIT 1
                    """,
                    (
                        username,
                    )
                )

                if cursor.fetchone():

                    raise ValueError(
                        (
                            "Identificatorul generat pentru "
                            "șofer este deja folosit."
                        )
                    )


                cursor.execute(
                    """
                    SELECT
                        id

                    FROM vehicles

                    WHERE vehicle_code = %s

                    LIMIT 1
                    """,
                    (
                        vehicle_code,
                    )
                )

                if cursor.fetchone():

                    raise ValueError(
                        (
                            "Identificatorul generat pentru "
                            "vehicul este deja folosit."
                        )
                    )


                password_hash = (
                    generate_password_hash(
                        password
                    )
                )


                cursor.execute(
                    """
                    INSERT INTO users (
                        username,
                        password_hash,
                        display_name,
                        role,
                        is_active
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        'driver',
                        TRUE
                    )
                    """,
                    (
                        username,
                        password_hash,
                        display_name,
                    )
                )


                user_id = (
                    cursor.lastrowid
                )


                cursor.execute(
                    """
                    INSERT INTO vehicles (
                        vehicle_code,
                        name,
                        vehicle_type,
                        status
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        'active'
                    )
                    """,
                    (
                        vehicle_code,
                        (
                            vehicle_name
                            or
                            vehicle_code
                        ),
                        vehicle_type,
                    )
                )


                vehicle_id = (
                    cursor.lastrowid
                )


                connection.commit()


                return jsonify({
                    "status":
                        "success",

                    "message":
                        (
                            "Șoferul și vehiculul au fost "
                            "create cu succes."
                        ),

                    "user": {
                        "id":
                            user_id,

                        "username":
                            username,

                        "display_name":
                            display_name,

                        "role":
                            "driver",

                        "is_active":
                            True
                    },

                    "vehicle": {
                        "id":
                            vehicle_id,

                        "vehicle_code":
                            vehicle_code,

                        "name":
                            (
                                vehicle_name
                                or
                                vehicle_code
                            ),

                        "vehicle_type":
                            vehicle_type,

                        "status":
                            "active"
                    }
                }), 201


            # =====================================
            # ADMIN / DISPECER
            # =====================================

            username = (
                requested_username
            )


            if not username:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Numele de utilizator "
                            "este obligatoriu."
                        )
                }), 400


            if len(username) < 3:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Numele de utilizator trebuie "
                            "să conțină cel puțin 3 caractere."
                        )
                }), 400


            if len(username) > 50:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Numele de utilizator nu poate "
                            "depăși 50 de caractere."
                        )
                }), 400


            cursor.execute(
                """
                SELECT
                    id

                FROM users

                WHERE username = %s

                LIMIT 1
                """,
                (
                    username,
                )
            )


            if cursor.fetchone():

                return jsonify({
                    "status":
                        "error",

                    "message":
                        (
                            "Numele de utilizator este "
                            "deja folosit."
                        )
                }), 409


            password_hash = (
                generate_password_hash(
                    password
                )
            )


            cursor.execute(
                """
                INSERT INTO users (
                    username,
                    password_hash,
                    display_name,
                    role,
                    is_active
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    TRUE
                )
                """,
                (
                    username,
                    password_hash,
                    display_name,
                    role,
                )
            )


            user_id = (
                cursor.lastrowid
            )


            connection.commit()


            return jsonify({
                "status":
                    "success",

                "message":
                    "Utilizatorul a fost creat.",

                "user": {
                    "id":
                        user_id,

                    "username":
                        username,

                    "display_name":
                        display_name,

                    "role":
                        role,

                    "is_active":
                        True
                }
            }), 201


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

        print(
            (
                "Utilizatorul nu a putut "
                f"fi creat: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Utilizatorul nu a putut "
                    "fi creat."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# ACTIVARE / DEZACTIVARE UTILIZATOR
# =====================================

@admin_bp.route(
    "/api/admin/users/<int:user_id>/active",
    methods=["PATCH"]
)
def update_admin_user_active_state(
    user_id
):

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )


    if (
        "is_active"
        not in
        data
    ):

        return jsonify({
            "status":
                "error",

            "message":
                "Câmpul is_active este obligatoriu."
        }), 400


    is_active = bool(
        data.get(
            "is_active"
        )
    )


    if (
        int(user_id)
        ==
        int(
            current_user.get(
                "id"
            )
        )
        and
        not is_active
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Nu îți poți dezactiva propriul "
                    "cont de administrator."
                )
        }), 400


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    username,
                    role,
                    is_active

                FROM users

                WHERE id = %s

                LIMIT 1
                """,
                (
                    user_id,
                )
            )


            user = (
                cursor.fetchone()
            )


            if not user:

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Utilizatorul nu există."
                }), 404


            cursor.execute(
                """
                UPDATE users

                SET
                    is_active = %s

                WHERE id = %s
                """,
                (
                    is_active,
                    user_id,
                )
            )


            if not is_active:

                cursor.execute(
                    """
                    UPDATE auth_tokens

                    SET
                        revoked_at =
                            COALESCE(
                                revoked_at,
                                UTC_TIMESTAMP()
                            )

                    WHERE
                        user_id = %s
                        AND revoked_at IS NULL
                    """,
                    (
                        user_id,
                    )
                )


            connection.commit()


            return jsonify({
                "status":
                    "success",

                "message":
                    (
                        "Contul a fost activat."
                        if is_active
                        else
                        "Contul a fost dezactivat."
                    ),

                "user_id":
                    user_id,

                "is_active":
                    is_active
            }), 200


    except Exception as error:

        connection.rollback()

        print(
            (
                "Starea utilizatorului nu a putut "
                f"fi modificată: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Starea utilizatorului nu a putut "
                    "fi modificată."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# RESETARE PAROLĂ UTILIZATOR
# =====================================

@admin_bp.route(
    "/api/admin/users/<int:user_id>/password",
    methods=["PATCH"]
)
def reset_admin_user_password(
    user_id
):

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )


    password = str(
        data.get(
            "password"
        )
        or
        ""
    )


    if len(password) < 8:

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Parola trebuie să conțină "
                    "cel puțin 8 caractere."
                )
        }), 400


    password_hash = (
        generate_password_hash(
            password
        )
    )


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id

                FROM users

                WHERE id = %s

                LIMIT 1
                """,
                (
                    user_id,
                )
            )


            if not cursor.fetchone():

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Utilizatorul nu există."
                }), 404


            cursor.execute(
                """
                UPDATE users

                SET
                    password_hash = %s

                WHERE id = %s
                """,
                (
                    password_hash,
                    user_id,
                )
            )


            cursor.execute(
                """
                UPDATE auth_tokens

                SET
                    revoked_at =
                        COALESCE(
                            revoked_at,
                            UTC_TIMESTAMP()
                        )

                WHERE
                    user_id = %s
                    AND revoked_at IS NULL
                """,
                (
                    user_id,
                )
            )


            connection.commit()


            return jsonify({
                "status":
                    "success",

                "message":
                    "Parola a fost schimbată."
            }), 200


    except Exception as error:

        connection.rollback()

        print(
            (
                "Parola nu a putut "
                f"fi schimbată: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                "Parola nu a putut fi schimbată."
        }), 500


    finally:

        connection.close()


# =====================================
# LISTĂ VEHICULE
# =====================================

@admin_bp.route(
    "/api/admin/vehicles",
    methods=["GET"]
)
def get_admin_vehicles():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

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

                LEFT JOIN current_positions cp
                    ON cp.vehicle_id = v.id

                ORDER BY
                    v.id ASC
                """
            )


            vehicles = (
                cursor.fetchall()
                or
                []
            )


            return jsonify({
                "status":
                    "success",

                "vehicles":
                    serialize_database_rows(
                        vehicles
                    )
            }), 200


    except Exception as error:

        print(
            (
                "Vehiculele nu au putut "
                f"fi încărcate: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Vehiculele nu au putut "
                    "fi încărcate."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# LISTĂ TABELE BAZĂ DE DATE
# =====================================

@admin_bp.route(
    "/api/admin/database/tables",
    methods=["GET"]
)
def get_admin_database_tables():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    table_name,

                    table_rows,

                    data_length,

                    index_length,

                    create_time,

                    update_time

                FROM information_schema.tables

                WHERE
                    table_schema = DATABASE()

                ORDER BY
                    table_name ASC
                """
            )


            tables = (
                cursor.fetchall()
                or
                []
            )


            return jsonify({
                "status":
                    "success",

                "tables":
                    serialize_database_rows(
                        tables
                    )
            }), 200


    except Exception as error:

        print(
            (
                "Tabelele bazei de date nu au "
                f"putut fi încărcate: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Tabelele bazei de date nu au "
                    "putut fi încărcate."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# STRUCTURĂ TABEL
# =====================================

@admin_bp.route(
    "/api/admin/database/tables/<table_name>/structure",
    methods=["GET"]
)
def get_admin_database_table_structure(
    table_name
):

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    try:

        table_name = (
            validate_sql_identifier(
                table_name
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
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            if not database_table_exists(
                cursor,
                table_name
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Tabelul nu există."
                }), 404


            cursor.execute(
                """
                SELECT
                    ordinal_position,
                    column_name,
                    column_type,
                    data_type,
                    is_nullable,
                    column_default,
                    column_key,
                    extra,
                    column_comment

                FROM information_schema.columns

                WHERE
                    table_schema = DATABASE()
                    AND table_name = %s

                ORDER BY
                    ordinal_position ASC
                """,
                (
                    table_name,
                )
            )


            columns = (
                cursor.fetchall()
                or
                []
            )


            cursor.execute(
                """
                SELECT
                    constraint_name,
                    constraint_type

                FROM information_schema.table_constraints

                WHERE
                    table_schema = DATABASE()
                    AND table_name = %s

                ORDER BY
                    constraint_type,
                    constraint_name
                """,
                (
                    table_name,
                )
            )


            constraints = (
                cursor.fetchall()
                or
                []
            )


            return jsonify({
                "status":
                    "success",

                "table_name":
                    table_name,

                "columns":
                    serialize_database_rows(
                        columns
                    ),

                "constraints":
                    serialize_database_rows(
                        constraints
                    )
            }), 200


    except Exception as error:

        print(
            (
                "Structura tabelului nu a putut "
                f"fi încărcată: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Structura tabelului nu a putut "
                    "fi încărcată."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# DATE TABEL
# =====================================

@admin_bp.route(
    "/api/admin/database/tables/<table_name>/rows",
    methods=["GET"]
)
def get_admin_database_table_rows(
    table_name
):

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    try:

        table_name = (
            validate_sql_identifier(
                table_name
            )
        )

    except ValueError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400


    try:

        page = max(
            1,
            int(
                request.args.get(
                    "page",
                    1
                )
            )
        )

        limit = int(
            request.args.get(
                "limit",
                DEFAULT_TABLE_LIMIT
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
                "Parametrii de paginare nu sunt valizi."
        }), 400


    limit = max(
        1,
        min(
            limit,
            MAX_TABLE_LIMIT
        )
    )


    offset = (
        (page - 1)
        *
        limit
    )


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            if not database_table_exists(
                cursor,
                table_name
            ):

                return jsonify({
                    "status":
                        "error",

                    "message":
                        "Tabelul nu există."
                }), 404


            quoted_table = (
                f"`{table_name}`"
            )


            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS total

                FROM {quoted_table}
                """
            )


            count_result = (
                cursor.fetchone()
                or
                {}
            )


            total = int(
                count_result.get(
                    "total",
                    0
                )
                or
                0
            )


            cursor.execute(
                f"""
                SELECT
                    *

                FROM {quoted_table}

                LIMIT %s
                OFFSET %s
                """,
                (
                    limit,
                    offset,
                )
            )


            rows = (
                cursor.fetchall()
                or
                []
            )


            return jsonify({
                "status":
                    "success",

                "table_name":
                    table_name,

                "page":
                    page,

                "limit":
                    limit,

                "total":
                    total,

                "rows":
                    serialize_database_rows(
                        rows
                    )
            }), 200


    except Exception as error:

        print(
            (
                "Datele tabelului nu au putut "
                f"fi încărcate: {error}"
            )
        )

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Datele tabelului nu au putut "
                    "fi încărcate."
                )
        }), 500


    finally:

        connection.close()


# =====================================
# CONSOLĂ SQL
# =====================================

@admin_bp.route(
    "/api/admin/database/query",
    methods=["POST"]
)
def execute_admin_database_query():

    current_user, error_response = (
        get_current_administrator()
    )

    if error_response:

        return error_response


    data = (
        request.get_json(
            silent=True
        )
        or
        {}
    )


    try:

        sql = (
            normalize_sql_statement(
                data.get(
                    "sql"
                )
            )
        )

        command = (
            get_sql_command(
                sql
            )
        )

    except ValueError as error:

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400


    confirm_write = (
        data.get(
            "confirm"
        )
        is True
    )


    if (
        command
        in
        BLOCKED_SQL_COMMANDS
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Această comandă SQL nu este permisă "
                    "din consola web."
                )
        }), 403


    if (
        command
        not in
        READ_ONLY_SQL_COMMANDS
        and
        command
        not in
        WRITE_SQL_COMMANDS
    ):

        return jsonify({
            "status":
                "error",

            "message":
                (
                    "Tipul comenzii SQL nu este "
                    "acceptat de consola administrativă."
                )
        }), 400


    is_write_query = (
        command
        in
        WRITE_SQL_COMMANDS
    )


    if (
        is_write_query
        and
        not confirm_write
    ):

        return jsonify({
            "status":
                "confirmation_required",

            "message":
                (
                    "Interogarea modifică baza de date. "
                    "Este necesară confirmarea explicită."
                ),

            "command":
                command,

            "sql":
                sql
        }), 409


    connection = (
        AuthService.get_db_connection()
    )


    try:

        with connection.cursor() as cursor:

            cursor.execute(
                sql
            )


            # =====================================
            # COMANDĂ CU REZULTATE
            # =====================================

            if cursor.description:

                rows = (
                    cursor.fetchmany(
                        MAX_SQL_ROWS
                    )
                    or
                    []
                )


                columns = [
                    description[0]
                    for description
                    in cursor.description
                ]


                if is_write_query:

                    connection.commit()


                return jsonify({
                    "status":
                        "success",

                    "command":
                        command,

                    "columns":
                        columns,

                    "rows":
                        serialize_database_rows(
                            rows
                        ),

                    "returned_rows":
                        len(
                            rows
                        ),

                    "max_rows":
                        MAX_SQL_ROWS,

                    "truncated":
                        (
                            len(rows)
                            >=
                            MAX_SQL_ROWS
                        )
                }), 200


            # =====================================
            # COMANDĂ FĂRĂ REZULTATE
            # =====================================

            affected_rows = (
                cursor.rowcount
            )


            if is_write_query:

                connection.commit()


            return jsonify({
                "status":
                    "success",

                "command":
                    command,

                "affected_rows":
                    affected_rows,

                "message":
                    "Comanda SQL a fost executată."
            }), 200


    except Exception as error:

        connection.rollback()

        return jsonify({
            "status":
                "error",

            "message":
                str(error)
        }), 400


    finally:

        connection.close()