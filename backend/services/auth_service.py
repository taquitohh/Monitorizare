import hashlib
import os
import re
import secrets

from datetime import (
    datetime,
    timedelta,
    timezone,
)

import pymysql

from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)


class AuthService:

    ACCESS_TOKEN_LIFETIME_SECONDS = 12 * 60 * 60

    # =====================================
    # CONEXIUNE BAZĂ DE DATE
    # =====================================

    @staticmethod
    def get_db_connection():

        return pymysql.connect(
            host=os.getenv(
                "DB_HOST",
                "database"
            ),
            port=int(
                os.getenv(
                    "DB_PORT",
                    "3306"
                )
            ),
            user=os.getenv(
                "DB_USER",
                "gps_user"
            ),
            password=os.getenv(
                "DB_PASSWORD",
                ""
            ),
            database=os.getenv(
                "DB_NAME",
                "gps_tracking"
            ),
            cursorclass=(
                pymysql.cursors.DictCursor
            ),
            autocommit=False
        )

    # =====================================
    # CĂUTARE UTILIZATOR DUPĂ USERNAME
    # =====================================

    @staticmethod
    def find_user_by_username(
        username
    ):

        username = str(
            username or ""
        ).strip()

        if not username:

            return None

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
                        password_hash,
                        display_name,
                        role,
                        is_active,
                        created_at,
                        updated_at

                    FROM users

                    WHERE username = %s

                    LIMIT 1
                    """,
                    (
                        username,
                    )
                )

                return cursor.fetchone()

        finally:

            connection.close()

    # =====================================
    # CĂUTARE UTILIZATOR DUPĂ ID
    # =====================================

    @staticmethod
    def find_user_by_id(
        user_id
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            return None

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

                    WHERE id = %s

                    LIMIT 1
                    """,
                    (
                        user_id,
                    )
                )

                return cursor.fetchone()

        finally:

            connection.close()

    # =====================================
    # AUTENTIFICARE PAROLĂ
    # =====================================

    @staticmethod
    def authenticate(
        username,
        password
    ):

        username = str(
            username or ""
        ).strip()

        password = str(
            password or ""
        )

        if not username or not password:

            return None

        user = (
            AuthService
            .find_user_by_username(
                username
            )
        )

        if not user:

            return None

        if not user["is_active"]:

            return None

        password_is_valid = (
            check_password_hash(
                user["password_hash"],
                password
            )
        )

        if not password_is_valid:

            return None

        return {
            "id":
                user["id"],

            "username":
                user["username"],

            "display_name":
                user["display_name"],

            "role":
                user["role"]
        }

    # =====================================
    # CREARE UTILIZATOR
    # =====================================

    @staticmethod
    def create_user(
        username,
        password,
        display_name,
        role
    ):

        username = str(
            username or ""
        ).strip()

        password = str(
            password or ""
        )

        display_name = str(
            display_name or ""
        ).strip()

        role = str(
            role or ""
        ).strip().lower()

        allowed_roles = {
            "administrator",
            "dispatcher",
            "driver"
        }

        if not username:

            raise ValueError(
                "Numele de utilizator este obligatoriu."
            )

        if len(username) < 3:

            raise ValueError(
                "Numele de utilizator trebuie să conțină "
                "cel puțin 3 caractere."
            )

        if len(username) > 50:

            raise ValueError(
                "Numele de utilizator nu poate depăși "
                "50 de caractere."
            )

        if not password:

            raise ValueError(
                "Parola este obligatorie."
            )

        if len(password) < 8:

            raise ValueError(
                "Parola trebuie să conțină "
                "cel puțin 8 caractere."
            )

        if not display_name:

            raise ValueError(
                "Numele afișat este obligatoriu."
            )

        if len(display_name) > 100:

            raise ValueError(
                "Numele afișat nu poate depăși "
                "100 de caractere."
            )

        if role not in allowed_roles:

            raise ValueError(
                "Rolul utilizatorului nu este valid."
            )

        if role == "driver":

            driver_username_match = (
                re.fullmatch(
                    r"sofer-(\d{3})",
                    username.lower()
                )
            )

            if not driver_username_match:

                raise ValueError(
                    "Conturile șoferilor trebuie să aibă "
                    "forma 'sofer-001', 'sofer-002' etc."
                )

        existing_user = (
            AuthService
            .find_user_by_username(
                username
            )
        )

        if existing_user:

            raise ValueError(
                "Numele de utilizator este deja folosit."
            )

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
                        role
                    )
                )

                user_id = (
                    cursor.lastrowid
                )

            connection.commit()

            return {
                "id":
                    user_id,

                "username":
                    username,

                "display_name":
                    display_name,

                "role":
                    role
            }

        except Exception:

            connection.rollback()

            raise

        finally:

            connection.close()

    # =====================================
    # HASH TOKEN
    # =====================================

    @staticmethod
    def hash_access_token(
        access_token
    ):

        access_token = str(
            access_token or ""
        ).strip()

        if not access_token:

            return None

        return hashlib.sha256(
            access_token.encode(
                "utf-8"
            )
        ).hexdigest()

    # =====================================
    # CREARE TOKEN
    # =====================================

    @staticmethod
    def create_access_token(
        user_id
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            raise ValueError(
                "Identificatorul utilizatorului nu este valid."
            )

        access_token = (
            secrets.token_urlsafe(
                48
            )
        )

        token_hash = (
            AuthService.hash_access_token(
                access_token
            )
        )

        expires_at = (
            datetime.now(
                timezone.utc
            )
            +
            timedelta(
                seconds=(
                    AuthService
                    .ACCESS_TOKEN_LIFETIME_SECONDS
                )
            )
        )

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM auth_tokens

                    WHERE
                        expires_at <= UTC_TIMESTAMP()

                        OR revoked_at IS NOT NULL
                    """
                )

                cursor.execute(
                    """
                    INSERT INTO auth_tokens (
                        user_id,
                        token_hash,
                        expires_at
                    )
                    VALUES (
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        user_id,
                        token_hash,
                        expires_at.replace(
                            tzinfo=None
                        )
                    )
                )

            connection.commit()

        except Exception:

            connection.rollback()

            raise

        finally:

            connection.close()

        return {
            "access_token":
                access_token,

            "token_type":
                "Bearer",

            "expires_in":
                (
                    AuthService
                    .ACCESS_TOKEN_LIFETIME_SECONDS
                )
        }

    # =====================================
    # UTILIZATOR DIN TOKEN
    # =====================================

    @staticmethod
    def get_user_by_access_token(
        access_token
    ):

        token_hash = (
            AuthService.hash_access_token(
                access_token
            )
        )

        if not token_hash:

            return None

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        u.id,
                        u.username,
                        u.display_name,
                        u.role,
                        u.is_active,

                        t.id AS token_id,
                        t.expires_at

                    FROM auth_tokens t

                    INNER JOIN users u
                        ON u.id = t.user_id

                    WHERE
                        t.token_hash = %s

                        AND t.revoked_at IS NULL

                        AND t.expires_at > UTC_TIMESTAMP()

                        AND u.is_active = TRUE

                    LIMIT 1
                    """,
                    (
                        token_hash,
                    )
                )

                user = (
                    cursor.fetchone()
                )

                if not user:

                    return None

                return {
                    "id":
                        user["id"],

                    "username":
                        user["username"],

                    "display_name":
                        user["display_name"],

                    "role":
                        user["role"]
                }

        finally:

            connection.close()

    # =====================================
    # REVOCARE TOKEN
    # =====================================

    @staticmethod
    def revoke_access_token(
        access_token
    ):

        token_hash = (
            AuthService.hash_access_token(
                access_token
            )
        )

        if not token_hash:

            return False

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    UPDATE auth_tokens

                    SET revoked_at = UTC_TIMESTAMP()

                    WHERE
                        token_hash = %s

                        AND revoked_at IS NULL
                    """,
                    (
                        token_hash,
                    )
                )

                token_was_revoked = (
                    cursor.rowcount > 0
                )

            connection.commit()

            return token_was_revoked

        except Exception:

            connection.rollback()

            raise

        finally:

            connection.close()

    # =====================================
    # CITIRE BEARER TOKEN
    # =====================================

    @staticmethod
    def extract_bearer_token(
        authorization_header
    ):

        authorization_header = str(
            authorization_header or ""
        ).strip()

        if not authorization_header:

            return None

        parts = (
            authorization_header.split(
                " ",
                1
            )
        )

        if len(parts) != 2:

            return None

        scheme = (
            parts[0].strip().lower()
        )

        access_token = (
            parts[1].strip()
        )

        if (
            scheme != "bearer"
            or
            not access_token
        ):

            return None

        return access_token

    # =====================================
    # UTILIZATOR DIN HEADER
    # =====================================

    @staticmethod
    def get_user_from_authorization_header(
        authorization_header
    ):

        access_token = (
            AuthService.extract_bearer_token(
                authorization_header
            )
        )

        if not access_token:

            return None

        return (
            AuthService
            .get_user_by_access_token(
                access_token
            )
        )

    # =====================================
    # COD VEHICUL DIN USERNAME
    # =====================================

    @staticmethod
    def get_vehicle_code_from_driver_username(
        username
    ):

        username = str(
            username or ""
        ).strip().lower()

        username_match = (
            re.fullmatch(
                r"sofer-(\d{3})",
                username
            )
        )

        if not username_match:

            raise ValueError(
                "Contul șoferului trebuie să aibă forma "
                "'sofer-001', 'sofer-002' etc."
            )

        vehicle_number = (
            username_match.group(1)
        )

        return (
            f"VEHICLE-{vehicle_number}"
        )

        # =====================================
    # DASHBOARD ȘOFER
    # =====================================

    @staticmethod
    def get_driver_dashboard(
        user_id
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            raise ValueError(
                "Identificatorul utilizatorului nu este valid."
            )

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                # =====================================
                # UTILIZATOR
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        id,
                        username,
                        display_name,
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

                    return None

                if not user["is_active"]:

                    raise PermissionError(
                        "Contul utilizatorului este inactiv."
                    )

                if user["role"] != "driver":

                    raise PermissionError(
                        "Contul nu aparține unui șofer."
                    )

                vehicle_code = (
                    AuthService
                    .get_vehicle_code_from_driver_username(
                        user["username"]
                    )
                )

                # =====================================
                # VEHICULUL ȘOFERULUI
                # =====================================

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

                    WHERE v.vehicle_code = %s

                    LIMIT 1
                    """,
                    (
                        vehicle_code,
                    )
                )

                vehicle = (
                    cursor.fetchone()
                )

                if not vehicle:

                    return {
                        "user":
                            user,

                        "expected_vehicle_code":
                            vehicle_code,

                        "vehicle":
                            None,

                        "mission":
                            None,

                        "same_type_vehicles":
                            []
                    }

                vehicle_id = (
                    vehicle["id"]
                )

                vehicle_type = (
                    vehicle["vehicle_type"]
                )

                # =====================================
                # MISIUNEA ACTIVĂ
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
                        i.status,
                        i.created_at,
                        i.updated_at,
                        i.dispatched_at,
                        i.resolved_at,

                        ia.assignment_type,
                        ia.status AS assignment_status,
                        ia.assigned_at

                    FROM incident_assignments ia

                    INNER JOIN incidents i
                        ON i.id = ia.incident_id

                    WHERE
                        ia.vehicle_id = %s

                        AND ia.status IN (
                            'assigned',
                            'in_progress'
                        )

                        AND i.status IN (
                            'assigned',
                            'in_progress'
                        )

                    ORDER BY
                        ia.assigned_at DESC,
                        ia.id DESC

                    LIMIT 1
                    """,
                    (
                        vehicle_id,
                    )
                )

                mission = (
                    cursor.fetchone()
                )

                # =====================================
                # VEHICULE DE ACELAȘI TIP
                # =====================================

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

                    WHERE
                        v.vehicle_type = %s

                        AND v.id != %s

                    ORDER BY
                        v.vehicle_code
                    """,
                    (
                        vehicle_type,
                        vehicle_id
                    )
                )

                same_type_vehicles = (
                    cursor.fetchall()
                )

                return {
                    "user":
                        user,

                    "expected_vehicle_code":
                        vehicle_code,

                    "vehicle":
                        vehicle,

                    "mission":
                        mission,

                    "same_type_vehicles":
                        same_type_vehicles
                }

        finally:

            connection.close()


        # =====================================
    # CREARE CERERE DE ÎNTĂRIRI
    # =====================================

    @staticmethod
    def create_reinforcement_request(
        user_id,
        requested_message=None
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            raise ValueError(
                "Identificatorul utilizatorului nu este valid."
            )

        requested_message = str(
            requested_message
            or
            ""
        ).strip()

        if len(requested_message) > 1000:

            raise ValueError(
                (
                    "Mesajul cererii de întăriri "
                    "nu poate depăși 1000 de caractere."
                )
            )

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                # =====================================
                # UTILIZATOR
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        id,
                        username,
                        display_name,
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

                    raise ValueError(
                        "Contul șoferului nu a fost găsit."
                    )

                if not user["is_active"]:

                    raise PermissionError(
                        "Contul utilizatorului este inactiv."
                    )

                if user["role"] != "driver":

                    raise PermissionError(
                        (
                            "Cererea de întăriri poate fi "
                            "trimisă doar de un șofer."
                        )
                    )

                vehicle_code = (
                    AuthService
                    .get_vehicle_code_from_driver_username(
                        user["username"]
                    )
                )


                # =====================================
                # VEHICUL
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        id,
                        vehicle_code,
                        name,
                        vehicle_type,
                        status

                    FROM vehicles

                    WHERE vehicle_code = %s

                    LIMIT 1

                    FOR UPDATE
                    """,
                    (
                        vehicle_code,
                    )
                )

                vehicle = (
                    cursor.fetchone()
                )

                if not vehicle:

                    raise ValueError(
                        (
                            "Vehiculul asociat contului "
                            "nu a fost găsit."
                        )
                    )


                # =====================================
                # MISIUNE ACTIVĂ
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        i.id AS incident_id,
                        i.incident_code,
                        i.title,
                        i.priority,
                        i.status AS incident_status,

                        ia.id AS assignment_id,
                        ia.assignment_type,
                        ia.status AS assignment_status,
                        ia.assigned_at

                    FROM incident_assignments ia

                    INNER JOIN incidents i
                        ON i.id = ia.incident_id

                    WHERE
                        ia.vehicle_id = %s

                        AND ia.status IN (
                            'assigned',
                            'in_progress'
                        )

                        AND i.status IN (
                            'assigned',
                            'in_progress'
                        )

                    ORDER BY
                        ia.assigned_at DESC,
                        ia.id DESC

                    LIMIT 1

                    FOR UPDATE
                    """,
                    (
                        vehicle["id"],
                    )
                )

                mission = (
                    cursor.fetchone()
                )

                if not mission:

                    raise ValueError(
                        (
                            "Întăririle pot fi solicitate "
                            "doar în timpul unei misiuni active."
                        )
                    )


                # =====================================
                # INSERARE CERERE NOUĂ
                # =====================================

               

                cursor.execute(
                    """
                    INSERT INTO reinforcement_requests (
                        incident_id,
                        requested_by_vehicle_id,
                        requested_vehicle_type,
                        requested_quantity,
                        requested_message,
                        assigned_quantity,
                        status
                    )
                    VALUES (
                        %s,
                        %s,
                        %s,
                        1,
                        %s,
                        0,
                        'pending'
                    )
                    """,
                    (
                        mission["incident_id"],
                        vehicle["id"],
                        vehicle["vehicle_type"],
                        (
                            requested_message
                            if requested_message
                            else None
                        )
                    )
                )

                reinforcement_request_id = (
                    cursor.lastrowid
                )


                # =====================================
                # CITIRE CERERE CREATĂ
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        id,
                        incident_id,
                        requested_by_vehicle_id,
                        requested_vehicle_type,
                        requested_quantity,
                        requested_message,
                        assigned_quantity,
                        status,
                        failure_message,
                        dispatcher_message,
                        reviewed_by_user_id,
                        reviewed_at,
                        created_at,
                        updated_at,
                        completed_at

                    FROM reinforcement_requests

                    WHERE id = %s

                    LIMIT 1
                    """,
                    (
                        reinforcement_request_id,
                    )
                )

                reinforcement_request = (
                    cursor.fetchone()
                )

            connection.commit()

            return {
                "created":
                    True,

                "request":
                    reinforcement_request,

                "incident": {
                    "id":
                        mission["incident_id"],

                    "incident_code":
                        mission["incident_code"],

                    "title":
                        mission["title"],

                    "priority":
                        mission["priority"]
                },

                "vehicle": {
                    "id":
                        vehicle["id"],

                    "vehicle_code":
                        vehicle["vehicle_code"],

                    "name":
                        vehicle["name"],

                    "vehicle_type":
                        vehicle["vehicle_type"]
                }
            }

        except Exception:

            connection.rollback()

            raise

        finally:

            connection.close()


    # =====================================
    # ULTIMA CERERE DE ÎNTĂRIRI A ȘOFERULUI
    # =====================================

    @staticmethod
    def get_latest_driver_reinforcement_request(
        user_id
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            return None

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                # =====================================
                # UTILIZATOR
                # =====================================

                cursor.execute(
                    """
                    SELECT
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

                if (
                    not user
                    or
                    not user["is_active"]
                    or
                    user["role"] != "driver"
                ):

                    return None

                vehicle_code = (
                    AuthService
                    .get_vehicle_code_from_driver_username(
                        user["username"]
                    )
                )

                cursor.execute(
                    """
                    SELECT
                        id,
                        vehicle_code

                    FROM vehicles

                    WHERE vehicle_code = %s

                    LIMIT 1
                    """,
                    (
                        vehicle_code,
                    )
                )

                vehicle = (
                    cursor.fetchone()
                )

                if not vehicle:

                    return None

                # =====================================
                # ULTIMA CERERE
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

                        i.incident_code,
                        i.title AS incident_title,

                        reviewer.display_name
                            AS reviewed_by_display_name

                    FROM reinforcement_requests rr

                    INNER JOIN incidents i
                        ON i.id = rr.incident_id

                    LEFT JOIN users reviewer
                        ON reviewer.id = rr.reviewed_by_user_id

                    WHERE
                        rr.requested_by_vehicle_id = %s

                    ORDER BY
                        rr.created_at DESC,
                        rr.id DESC

                    LIMIT 1
                    """,
                    (
                        vehicle["id"],
                    )
                )

                reinforcement_request = (
                    cursor.fetchone()
                )

                if not reinforcement_request:

                    return None

                # =====================================
                # RESURSE APROBATE
                # =====================================

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

                return reinforcement_request

        finally:

            connection.close()

    # =====================================
    # ISTORIC CERERI DE ÎNTĂRIRI ȘOFER
    # =====================================

    @staticmethod
    def get_driver_reinforcement_request_history(
        user_id
    ):

        try:

            user_id = int(
                user_id
            )

        except (
            TypeError,
            ValueError
        ):

            return []

        connection = (
            AuthService.get_db_connection()
        )

        try:

            with connection.cursor() as cursor:

                # =====================================
                # UTILIZATOR
                # =====================================

                cursor.execute(
                    """
                    SELECT
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

                if (
                    not user
                    or
                    not user["is_active"]
                    or
                    user["role"] != "driver"
                ):

                    return []

                vehicle_code = (
                    AuthService
                    .get_vehicle_code_from_driver_username(
                        user["username"]
                    )
                )

                # =====================================
                # VEHICUL
                # =====================================

                cursor.execute(
                    """
                    SELECT
                        id,
                        vehicle_code

                    FROM vehicles

                    WHERE vehicle_code = %s

                    LIMIT 1
                    """,
                    (
                        vehicle_code,
                    )
                )

                vehicle = (
                    cursor.fetchone()
                )

                if not vehicle:

                    return []

                # =====================================
                # TOATE CERERILE ȘOFERULUI
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

                        i.incident_code,
                        i.title AS incident_title,
                        i.status AS incident_status,

                        reviewer.display_name
                            AS reviewed_by_display_name

                    FROM reinforcement_requests rr

                    INNER JOIN incidents i
                        ON i.id = rr.incident_id

                    LEFT JOIN users reviewer
                        ON reviewer.id = rr.reviewed_by_user_id

                    WHERE
                        rr.requested_by_vehicle_id = %s

                    ORDER BY
                        rr.created_at DESC,
                        rr.id DESC
                    """,
                    (
                        vehicle["id"],
                    )
                )

                reinforcement_requests = (
                    cursor.fetchall()
                )

                if not reinforcement_requests:

                    return []

                # =====================================
                # RESURSE PENTRU FIECARE CERERE
                # =====================================

                for reinforcement_request in reinforcement_requests:

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

                return reinforcement_requests

        finally:

            connection.close()