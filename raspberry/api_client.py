import requests

from config import API_URL


# =====================================
# SEND VEHICLE DATA
# =====================================

def send_vehicle_data(
    vehicle
):

    data = (
        vehicle.get_data()
    )


    try:

        response = requests.post(
            API_URL,
            json=data,
            timeout=5
        )


        print(
            f"{vehicle.vehicle_id} "
            f"({vehicle.vehicle_type}) "
            f"-> HTTP {response.status_code}"
        )


        try:

            return response.json()

        except ValueError:

            return None


    except requests.exceptions.RequestException as error:

        print(
            (
                "Eroare la trimiterea datelor pentru "
                f"{vehicle.vehicle_id}: {error}"
            )
        )

        return None


# =====================================
# GET VEHICLES FOR SIMULATOR
# =====================================

def get_simulator_vehicles():

    simulator_url = (
        API_URL.rstrip("/")
        +
        "/simulator"
    )


    try:

        response = requests.get(
            simulator_url,
            timeout=5
        )


        if response.status_code != 200:

            print(
                (
                    "Lista vehiculelor pentru simulator "
                    "nu a putut fi încărcată: "
                    f"HTTP {response.status_code}"
                )
            )

            return []


        try:

            data = (
                response.json()
            )

        except ValueError:

            print(
                (
                    "Răspuns invalid primit pentru "
                    "lista vehiculelor simulatorului."
                )
            )

            return []


        vehicles = (
            data.get(
                "vehicles"
            )
            or
            []
        )


        if not isinstance(
            vehicles,
            list
        ):

            return []


        return vehicles


    except requests.exceptions.RequestException as error:

        print(
            (
                "Eroare la citirea vehiculelor "
                f"pentru simulator: {error}"
            )
        )

        return []


# =====================================
# GET ACTIVE ASSIGNMENT
# =====================================

def get_active_assignment(
    vehicle
):

    try:

        response = requests.get(
            (
                f"{API_URL}/"
                f"{vehicle.vehicle_id}/"
                "active-assignment"
            ),
            timeout=5
        )


        if response.status_code != 200:

            return None


        try:

            return response.json()

        except ValueError:

            return None


    except requests.exceptions.RequestException as error:

        print(
            (
                "Eroare la verificarea incidentului pentru "
                f"{vehicle.vehicle_id}: {error}"
            )
        )

        return None


# =====================================
# NOTIFY INCIDENT ARRIVAL
# =====================================

def notify_incident_arrived(
    vehicle,
    incident_id
):

    try:

        response = requests.patch(
            (
                f"{API_URL.replace('/api/vehicles', '')}"
                f"/api/incidents/{incident_id}/arrived"
            ),

            json={
                "vehicle_code":
                    vehicle.vehicle_id
            },

            timeout=5
        )


        try:

            data = (
                response.json()
            )

        except ValueError:

            print(
                (
                    "Răspuns invalid la sosirea "
                    f"vehiculului {vehicle.vehicle_id}: "
                    f"HTTP {response.status_code}"
                )
            )

            return None


        if response.status_code != 200:

            print(
                (
                    "Eroare la închiderea incidentului "
                    f"pentru {vehicle.vehicle_id}: "
                    f"HTTP {response.status_code} - "
                    f"{data.get('message', '-')}"
                )
            )

            return None


        print(
            (
                f"{vehicle.vehicle_id}: "
                f"incidentul {incident_id} "
                "a fost marcat ca rezolvat."
            )
        )


        return data


    except requests.exceptions.RequestException as error:

        print(
            (
                "Eroare la notificarea sosirii pentru "
                f"{vehicle.vehicle_id}: {error}"
            )
        )

        return None