import json

from services.auth_service import AuthService


class SpecialistService:

    # =====================================
    # DATABASE CONNECTION
    # =====================================

    @staticmethod
    def get_db_connection():

        return (
            AuthService
            .get_db_connection()
        )


    # =====================================
    # SERVICE TYPE NORMALIZATION
    # =====================================

    SERVICE_TYPE_MAP = {
        "police": "police",
        "ambulance": "ambulance",
        "fire": "firefighters",
        "firefighters": "firefighters"
    }


    # =====================================
    # NORMALIZE SERVICE TYPE
    # =====================================

    @classmethod
    def normalize_service_type(
        cls,
        service_type
    ):

        value = str(
            service_type or ""
        ).strip().lower()

        return cls.SERVICE_TYPE_MAP.get(
            value
        )


    # =====================================
    # CREATE REQUIRED REPORTS
    # =====================================

    @classmethod
    def create_required_reports(
        cls,
        cursor,
        incident_id
    ):

        """
        Creează câte UN chestionar pentru fiecare
        tip DISTINCT de serviciu implicat în incident.

        Exemplu:
        2 police
        1 ambulance
        3 fire

        => 3 chestionare:
           police
           ambulance
           firefighters

        Metoda NU face commit.
        Commit-ul rămâne responsabilitatea
        endpoint-ului / tranzacției apelante.
        """

        cursor.execute(
            """
            SELECT DISTINCT
                v.vehicle_type

            FROM incident_assignments ia

            INNER JOIN vehicles v
                ON v.id = ia.vehicle_id

            WHERE
                ia.incident_id = %s

                AND ia.status IN (
                    'assigned',
                    'in_progress'
                )
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

        service_types = []

        for row in rows:

            service_type = (
                cls.normalize_service_type(
                    row.get(
                        "vehicle_type"
                    )
                )
            )

            if not service_type:

                continue

            if (
                service_type
                not in service_types
            ):

                service_types.append(
                    service_type
                )

        # =====================================
        # CREATE MISSING REPORTS
        # =====================================

        for service_type in service_types:

            cursor.execute(
                """
                INSERT INTO
                    incident_specialist_reports (
                        incident_id,
                        service_type,
                        status
                    )

                VALUES (
                    %s,
                    %s,
                    'pending'
                )

                ON DUPLICATE KEY UPDATE
                    service_type =
                        VALUES(service_type)
                """,
                (
                    incident_id,
                    service_type
                )
            )

        return cls.get_reports(
            cursor,
            incident_id
        )


    # =====================================
    # GET REPORTS FOR INCIDENT
    # =====================================

    @classmethod
    def get_reports(
        cls,
        cursor,
        incident_id
    ):

        cursor.execute(
            """
            SELECT
                id,
                incident_id,
                service_type,
                status,
                created_at,
                updated_at,
                confirmed_at,
                confirmed_by_user_id

            FROM incident_specialist_reports

            WHERE incident_id = %s

            ORDER BY
                FIELD(
                    service_type,
                    'police',
                    'ambulance',
                    'firefighters'
                ),
                id
            """,
            (
                incident_id,
            )
        )

        reports = (
            cursor.fetchall()
            or
            []
        )

        for report in reports:

            report[
                "answers"
            ] = cls.get_answers(
                cursor,
                report["id"]
            )

        return reports


    # =====================================
    # GET SINGLE REPORT
    # =====================================

    @classmethod
    def get_report(
        cls,
        cursor,
        report_id
    ):

        cursor.execute(
            """
            SELECT
                id,
                incident_id,
                service_type,
                status,
                created_at,
                updated_at,
                confirmed_at,
                confirmed_by_user_id

            FROM incident_specialist_reports

            WHERE id = %s

            LIMIT 1
            """,
            (
                report_id,
            )
        )

        report = cursor.fetchone()

        if not report:

            return None

        report[
            "answers"
        ] = cls.get_answers(
            cursor,
            report_id
        )

        return report


    # =====================================
    # GET ANSWERS
    # =====================================

    @classmethod
    def get_answers(
        cls,
        cursor,
        report_id
    ):

        cursor.execute(
            """
            SELECT
                id,
                report_id,
                question_code,
                answer_value,
                created_at,
                updated_at

            FROM incident_specialist_answers

            WHERE report_id = %s

            ORDER BY id
            """,
            (
                report_id,
            )
        )

        answers = (
            cursor.fetchall()
            or
            []
        )

        result = {}

        for answer in answers:

            result[
                answer["question_code"]
            ] = answer["answer_value"]

        return result


    # =====================================
    # SAVE / AUTOSAVE ANSWER
    # =====================================

    @classmethod
    def save_answer(
        cls,
        cursor,
        report_id,
        question_code,
        answer_value,
        changed_by_user_id=None
    ):

        question_code = str(
            question_code or ""
        ).strip()

        if not question_code:

            raise ValueError(
                "Codul întrebării este obligatoriu."
            )

        # =====================================
        # CHECK REPORT
        # =====================================

        cursor.execute(
            """
            SELECT
                id,
                incident_id,
                service_type,
                status

            FROM incident_specialist_reports

            WHERE id = %s

            LIMIT 1
            """,
            (
                report_id,
            )
        )

        report = cursor.fetchone()

        if not report:

            raise ValueError(
                "Chestionarul specializat nu există."
            )

        if (
            report["status"]
            ==
            "confirmed"
        ):

            raise ValueError(
                "Chestionarul a fost deja confirmat."
            )

        # =====================================
        # NORMALIZE ANSWER
        # =====================================

        if isinstance(
            answer_value,
            (
                dict,
                list
            )
        ):

            stored_value = json.dumps(
                answer_value,
                ensure_ascii=False
            )

        elif answer_value is None:

            stored_value = None

        else:

            stored_value = str(
                answer_value
            )

        # =====================================
        # GET PREVIOUS VALUE
        # =====================================

        cursor.execute(
            """
            SELECT
                answer_value

            FROM incident_specialist_answers

            WHERE
                report_id = %s
                AND question_code = %s

            LIMIT 1
            """,
            (
                report_id,
                question_code
            )
        )

        previous_answer = (
            cursor.fetchone()
        )

        previous_value = (
            previous_answer[
                "answer_value"
            ]
            if previous_answer
            else None
        )

        # =====================================
        # SAVE CURRENT VALUE
        # =====================================

        cursor.execute(
            """
            INSERT INTO
                incident_specialist_answers (
                    report_id,
                    question_code,
                    answer_value
                )

            VALUES (
                %s,
                %s,
                %s
            )

            ON DUPLICATE KEY UPDATE
                answer_value =
                    VALUES(answer_value),

                updated_at =
                    CURRENT_TIMESTAMP
            """,
            (
                report_id,
                question_code,
                stored_value
            )
        )

        # =====================================
        # SAVE HISTORY ONLY IF CHANGED
        # =====================================

        if (
            previous_answer is None
            or
            previous_value != stored_value
        ):

            cursor.execute(
                """
                INSERT INTO
                    incident_specialist_answer_history (
                        report_id,
                        question_code,
                        answer_value,
                        changed_by_user_id
                    )

                VALUES (
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    report_id,
                    question_code,
                    stored_value,
                    changed_by_user_id
                )
            )

        # =====================================
        # MOVE REPORT TO IN PROGRESS
        # =====================================

        cursor.execute(
            """
            UPDATE incident_specialist_reports

            SET status =
                CASE

                    WHEN status = 'pending'
                        THEN 'in_progress'

                    ELSE status

                END

            WHERE id = %s
            """,
            (
                report_id,
            )
        )

        return {
            "report_id":
                report_id,

            "incident_id":
                report["incident_id"],

            "service_type":
                report["service_type"],

            "question_code":
                question_code,

            "answer_value":
                stored_value,

            "previous_value":
                previous_value
        }


    # =====================================
    # CONFIRM REPORT
    # =====================================

    @classmethod
    def confirm_report(
        cls,
        cursor,
        report_id,
        confirmed_by_user_id=None
    ):

        cursor.execute(
            """
            SELECT
                id,
                incident_id,
                service_type,
                status

            FROM incident_specialist_reports

            WHERE id = %s

            LIMIT 1
            """,
            (
                report_id,
            )
        )

        report = cursor.fetchone()

        if not report:

            raise ValueError(
                "Chestionarul specializat nu există."
            )

        if (
            report["status"]
            !=
            "confirmed"
        ):

            cursor.execute(
                """
                UPDATE incident_specialist_reports

                SET
                    status = 'confirmed',

                    confirmed_at =
                        CURRENT_TIMESTAMP,

                    confirmed_by_user_id = %s

                WHERE id = %s
                """,
                (
                    confirmed_by_user_id,
                    report_id
                )
            )

        return cls.get_report(
            cursor,
            report_id
        )


    # =====================================
    # CHECK ALL REPORTS CONFIRMED
    # =====================================

    @classmethod
    def all_reports_confirmed(
        cls,
        cursor,
        incident_id
    ):

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_reports,

                SUM(
                    CASE
                        WHEN status = 'confirmed'
                            THEN 1
                        ELSE 0
                    END
                ) AS confirmed_reports

            FROM incident_specialist_reports

            WHERE incident_id = %s
            """,
            (
                incident_id,
            )
        )

        result = (
            cursor.fetchone()
            or
            {}
        )

        total_reports = int(
            result.get(
                "total_reports"
            )
            or
            0
        )

        confirmed_reports = int(
            result.get(
                "confirmed_reports"
            )
            or
            0
        )

        return {
            "total":
                total_reports,

            "confirmed":
                confirmed_reports,

            "pending":
                max(
                    total_reports
                    -
                    confirmed_reports,
                    0
                ),

            "complete":
                (
                    total_reports > 0
                    and
                    total_reports
                    ==
                    confirmed_reports
                )
        }