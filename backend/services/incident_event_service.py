# =====================================
# INCIDENT EVENT SERVICE
# =====================================

import json

from services.auth_service import AuthService


# =====================================
# SERVICE
# =====================================

class IncidentEventService:


    # =================================
    # CONEXIUNE DB
    # =================================

    @staticmethod
    def get_db_connection():

        return AuthService.get_db_connection()


    # =================================
    # CREARE EVENIMENT
    # =================================

    @staticmethod
    def create_event(
        incident_id,
        event_type,
        message,
        source_type=None,
        source_id=None,
        service_type=None,
        metadata=None,
        created_by_user_id=None
    ):

        if not incident_id:

            raise ValueError(
                "Incidentul este obligatoriu."
            )


        if not event_type:

            raise ValueError(
                "Tipul evenimentului este obligatoriu."
            )


        if not message:

            raise ValueError(
                "Mesajul evenimentului este obligatoriu."
            )


        normalized_metadata = (
            IncidentEventService
            .serialize_metadata(
                metadata
            )
        )


        connection = (
            IncidentEventService
            .get_db_connection()
        )


        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO
                        incident_events
                    (
                        incident_id,
                        event_type,
                        source_type,
                        source_id,
                        service_type,
                        message,
                        metadata_json,
                        created_by_user_id
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    """,
                    (
                        incident_id,
                        event_type,
                        source_type,
                        source_id,
                        service_type,
                        message,
                        normalized_metadata,
                        created_by_user_id
                    )
                )


                event_id = (
                    cursor.lastrowid
                )


            connection.commit()


            return (
                IncidentEventService
                .get_event(
                    event_id
                )
            )


        except Exception:

            connection.rollback()

            raise


        finally:

            connection.close()


    # =================================
    # CITIRE EVENIMENT
    # =================================

    @staticmethod
    def get_event(
        event_id
    ):

        connection = (
            IncidentEventService
            .get_db_connection()
        )


        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        incident_id,
                        event_type,
                        source_type,
                        source_id,
                        service_type,
                        message,
                        metadata_json,
                        created_by_user_id,
                        created_at

                    FROM
                        incident_events

                    WHERE
                        id = %s

                    LIMIT 1
                    """,
                    (
                        event_id,
                    )
                )


                event = (
                    cursor.fetchone()
                )


                return (
                    IncidentEventService
                    .deserialize_event(
                        event
                    )
                )


        finally:

            connection.close()


    # =================================
    # CRONOLOGIE INCIDENT
    # =================================

    @staticmethod
    def get_incident_events(
        incident_id
    ):

        connection = (
            IncidentEventService
            .get_db_connection()
        )


        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        incident_id,
                        event_type,
                        source_type,
                        source_id,
                        service_type,
                        message,
                        metadata_json,
                        created_by_user_id,
                        created_at

                    FROM
                        incident_events

                    WHERE
                        incident_id = %s

                    ORDER BY
                        created_at ASC,
                        id ASC
                    """,
                    (
                        incident_id,
                    )
                )


                rows = (
                    cursor.fetchall()
                    or
                    []
                )


                return [
                    IncidentEventService
                    .deserialize_event(
                        row
                    )
                    for row
                    in rows
                ]


        finally:

            connection.close()


    # =================================
    # ȘTERGERE EVENIMENTE INCIDENT
    # =================================

    @staticmethod
    def delete_incident_events(
        incident_id
    ):

        connection = (
            IncidentEventService
            .get_db_connection()
        )


        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    DELETE FROM
                        incident_events

                    WHERE
                        incident_id = %s
                    """,
                    (
                        incident_id,
                    )
                )


                deleted_rows = (
                    cursor.rowcount
                )


            connection.commit()


            return deleted_rows


        except Exception:

            connection.rollback()

            raise


        finally:

            connection.close()


    # =================================
    # EVENIMENT INCIDENT CREAT
    # =================================

    @staticmethod
    def incident_created(
        incident_id,
        metadata=None,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "incident_created",

                source_type=
                    "incident",

                source_id=
                    incident_id,

                message=
                    "Incidentul a fost înregistrat.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # INCIDENT ACCEPTAT
    # =================================

    @staticmethod
    def incident_accepted(
        incident_id,
        metadata=None,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "incident_accepted",

                source_type=
                    "dispatcher",

                source_id=
                    user_id,

                message=
                    "Incidentul a fost acceptat de dispecerat.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # VEHICUL ALOCAT
    # =================================

    @staticmethod
    def vehicle_assigned(
        incident_id,
        vehicle_id,
        vehicle_code=None,
        service_type=None,
        user_id=None
    ):

        metadata = {
            "vehicle_id":
                vehicle_id,

            "vehicle_code":
                vehicle_code
        }


        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "vehicle_assigned",

                source_type=
                    "vehicle",

                source_id=
                    vehicle_id,

                service_type=
                    service_type,

                message=
                    (
                        "Vehiculul "
                        +
                        str(
                            vehicle_code
                            or
                            vehicle_id
                        )
                        +
                        " a fost alocat incidentului."
                    ),

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # VEHICUL PORNIT
    # =================================

    @staticmethod
    def vehicle_dispatched(
        incident_id,
        vehicle_id,
        vehicle_code=None,
        service_type=None,
        user_id=None
    ):

        metadata = {
            "vehicle_id":
                vehicle_id,

            "vehicle_code":
                vehicle_code
        }


        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "vehicle_dispatched",

                source_type=
                    "vehicle",

                source_id=
                    vehicle_id,

                service_type=
                    service_type,

                message=
                    (
                        "Vehiculul "
                        +
                        str(
                            vehicle_code
                            or
                            vehicle_id
                        )
                        +
                        " a pornit către incident."
                    ),

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # VEHICUL AJUNS
    # =================================

    @staticmethod
    def vehicle_arrived(
        incident_id,
        vehicle_id,
        vehicle_code=None,
        service_type=None,
        user_id=None
    ):

        metadata = {
            "vehicle_id":
                vehicle_id,

            "vehicle_code":
                vehicle_code
        }


        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "vehicle_arrived",

                source_type=
                    "vehicle",

                source_id=
                    vehicle_id,

                service_type=
                    service_type,

                message=
                    (
                        "Vehiculul "
                        +
                        str(
                            vehicle_code
                            or
                            vehicle_id
                        )
                        +
                        " a ajuns la incident."
                    ),

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # CERERE ÎNTĂRIRI
    # =================================

    @staticmethod
    def reinforcement_requested(
        incident_id,
        request_id,
        vehicle_id=None,
        message_text=None,
        user_id=None
    ):

        metadata = {
            "request_id":
                request_id,

            "vehicle_id":
                vehicle_id,

            "message":
                message_text
        }


        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "reinforcement_requested",

                source_type=
                    "reinforcement",

                source_id=
                    request_id,

                message=
                    "A fost transmisă o cerere de întăriri.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # CERERE APROBATĂ
    # =================================

    @staticmethod
    def reinforcement_approved(
        incident_id,
        request_id,
        metadata=None,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "reinforcement_approved",

                source_type=
                    "reinforcement",

                source_id=
                    request_id,

                message=
                    "Cererea de întăriri a fost aprobată.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # CERERE RESPINSĂ
    # =================================

    @staticmethod
    def reinforcement_rejected(
        incident_id,
        request_id,
        metadata=None,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "reinforcement_rejected",

                source_type=
                    "reinforcement",

                source_id=
                    request_id,

                message=
                    "Cererea de întăriri a fost respinsă.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # CHESTIONAR CREAT
    # =================================

    @staticmethod
    def specialist_report_created(
        incident_id,
        report_id,
        service_type,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "specialist_report_created",

                source_type=
                    "specialist",

                source_id=
                    report_id,

                service_type=
                    service_type,

                message=
                    (
                        "Chestionarul pentru "
                        +
                        IncidentEventService
                        .get_service_display_name(
                            service_type
                        )
                        +
                        " a fost creat."
                    ),

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # RĂSPUNS ACTUALIZAT
    # =================================

    @staticmethod
    def specialist_answer_updated(
        incident_id,
        report_id,
        service_type,
        question_code,
        old_value,
        new_value,
        user_id=None
    ):

        metadata = {
            "report_id":
                report_id,

            "question_code":
                question_code,

            "old_value":
                old_value,

            "new_value":
                new_value
        }


        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "specialist_answer_updated",

                source_type=
                    "specialist",

                source_id=
                    report_id,

                service_type=
                    service_type,

                message=
                    (
                        "Informațiile operative pentru "
                        +
                        IncidentEventService
                        .get_service_display_name(
                            service_type
                        )
                        +
                        " au fost actualizate."
                    ),

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # CHESTIONAR CONFIRMAT
    # =================================

    @staticmethod
    def specialist_report_confirmed(
        incident_id,
        report_id,
        service_type,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "specialist_report_confirmed",

                source_type=
                    "specialist",

                source_id=
                    report_id,

                service_type=
                    service_type,

                message=
                    (
                        "Informațiile pentru "
                        +
                        IncidentEventService
                        .get_service_display_name(
                            service_type
                        )
                        +
                        " au fost confirmate."
                    ),

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # INCIDENT FINALIZAT
    # =================================

    @staticmethod
    def incident_resolved(
        incident_id,
        metadata=None,
        user_id=None
    ):

        return (
            IncidentEventService
            .create_event(
                incident_id=
                    incident_id,

                event_type=
                    "incident_resolved",

                source_type=
                    "incident",

                source_id=
                    incident_id,

                message=
                    "Incidentul a fost finalizat.",

                metadata=
                    metadata,

                created_by_user_id=
                    user_id
            )
        )


    # =================================
    # SERIALIZARE METADATA
    # =================================

    @staticmethod
    def serialize_metadata(
        metadata
    ):

        if metadata is None:

            return None


        if isinstance(
            metadata,
            str
        ):

            return metadata


        return json.dumps(
            metadata,
            ensure_ascii=False,
            default=str
        )


    # =================================
    # DESERIALIZARE EVENIMENT
    # =================================

    @staticmethod
    def deserialize_event(
        event
    ):

        if not event:

            return None


        result = dict(
            event
        )


        raw_metadata = (
            result.get(
                "metadata_json"
            )
        )


        if raw_metadata:

            try:

                result["metadata"] = (
                    json.loads(
                        raw_metadata
                    )
                )


            except (
                TypeError,
                ValueError
            ):

                result["metadata"] = (
                    raw_metadata
                )


        else:

            result["metadata"] = None


        return result


    # =================================
    # NUME SERVICIU
    # =================================

    @staticmethod
    def get_service_display_name(
        service_type
    ):

        names = {
            "police":
                "Poliție",

            "ambulance":
                "Ambulanță",

            "firefighters":
                "Pompieri"
        }


        return names.get(
            service_type,
            str(
                service_type
                or
                "serviciul selectat"
            )
        )