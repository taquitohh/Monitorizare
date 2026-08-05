from services.auth_service import AuthService


def create_basic_users():

    basic_users = [
        {
            "username":
                "administrator",

            "password":
                "Admin2026!",

            "display_name":
                "Administrator sistem",

            "role":
                "administrator"
        },
        {
            "username":
                "dispecer",

            "password":
                "Dispecer2026!",

            "display_name":
                "Dispecerat central",

            "role":
                "dispatcher"
        }
    ]

    for user_data in basic_users:

        try:

            user = AuthService.create_user(
                username=(
                    user_data["username"]
                ),
                password=(
                    user_data["password"]
                ),
                display_name=(
                    user_data["display_name"]
                ),
                role=(
                    user_data["role"]
                )
            )

            print(
                "Utilizator creat:",
                user["username"]
            )

        except ValueError as error:

            print(
                user_data["username"],
                "->",
                error
            )


def create_driver_users():

    connection = (
        AuthService.get_db_connection()
    )

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    vehicle_code

                FROM vehicles

                WHERE vehicle_code
                    LIKE 'VEHICLE-___'

                ORDER BY vehicle_code
                """
            )

            vehicles = (
                cursor.fetchall()
            )

    finally:

        connection.close()

    if not vehicles:

        print(
            "Nu au fost găsite vehicule "
            "pentru crearea conturilor de șofer."
        )

        return

    for vehicle in vehicles:

        vehicle_code = str(
            vehicle["vehicle_code"]
        ).strip().upper()

        vehicle_number = (
            vehicle_code
                .split("-")[-1]
        )

        username = (
            f"sofer-{vehicle_number}"
        )

        password = (
            f"Sofer{vehicle_number}!"
        )

        display_name = (
            f"Șofer vehicul {vehicle_number}"
        )

        try:

            user = AuthService.create_user(
                username=(
                    username
                ),
                password=(
                    password
                ),
                display_name=(
                    display_name
                ),
                role=(
                    "driver"
                )
            )

            print(
                "Utilizator creat:",
                user["username"],
                "| parola temporară:",
                password
            )

        except ValueError as error:

            print(
                username,
                "->",
                error
            )


def main():

    create_basic_users()

    create_driver_users()


if __name__ == "__main__":

    main()