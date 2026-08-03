import requests

from config import API_URL


# =====================================
# SEND VEHICLE DATA
# =====================================

def send_vehicle_data(vehicle):

    data = vehicle.get_data()

    try:

        response = requests.post(
            API_URL,
            json=data,
            timeout=5
        )

        print(
            f"{vehicle.vehicle_id} ({vehicle.vehicle_type}) -> HTTP {response.status_code}"
        )

        return response.json()

    except requests.exceptions.RequestException as error:

        print(
            f"Eroare la trimiterea datelor pentru "
            f"{vehicle.vehicle_id}: {error}"
        )

        return None


# =====================================
# GET ACTIVE ASSIGNMENT
# =====================================

def get_active_assignment(vehicle):

    try:

        response = requests.get(

            f"{API_URL}/{vehicle.vehicle_id}/active-assignment",

            timeout=5

        )

        if response.status_code != 200:

            return None

        return response.json()

    except requests.exceptions.RequestException as error:

        print(

            f"Eroare la verificarea incidentului pentru "
            f"{vehicle.vehicle_id}: {error}"

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

            data = response.json()

        except ValueError:

            print(
                f"Răspuns invalid la sosirea "
                f"vehiculului {vehicle.vehicle_id}: "
                f"HTTP {response.status_code}"
            )

            return None

        if response.status_code != 200:

            print(
                f"Eroare la închiderea incidentului "
                f"pentru {vehicle.vehicle_id}: "
                f"HTTP {response.status_code} - "
                f"{data.get('message', '-')}"
            )

            return None

        print(
            f"{vehicle.vehicle_id}: "
            f"incidentul {incident_id} "
            f"a fost marcat ca rezolvat."
        )

        return data

    except requests.exceptions.RequestException as error:

        print(
            f"Eroare la notificarea sosirii pentru "
            f"{vehicle.vehicle_id}: {error}"
        )

        return None