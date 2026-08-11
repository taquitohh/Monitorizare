import time

from routes import RoadNetwork

from vehicles import (
    create_vehicles,
    add_missing_vehicles
)

from movement import MovementEngine

from api_client import (
    send_vehicle_data,
    get_active_assignment,
    notify_incident_arrived,
    get_simulator_vehicles
)

from config import (
    NUMBER_OF_VEHICLES,
    UPDATE_INTERVAL
)


# =====================================
# SYNCHRONIZE VEHICLE ASSIGNMENT
# =====================================

def synchronize_assignment(
    vehicle,
    movement
):

    assignment_data = (
        get_active_assignment(
            vehicle
        )
    )


    if not assignment_data:

        return


    is_assigned = (
        assignment_data.get(
            "assigned",
            False
        )
    )


    if not is_assigned:

        if (
            vehicle.assigned_incident
            is not None
        ):

            print(
                f"{vehicle.vehicle_id}: "
                "misiunea a fost închisă."
            )


            vehicle.clear_incident()


            movement.return_to_random_movement(
                vehicle
            )


        return


    incident = (
        assignment_data.get(
            "incident"
        )
    )


    if not incident:

        return


    incident_id = (
        incident.get(
            "id"
        )
    )


    current_incident_id = None


    if vehicle.assigned_incident:

        current_incident_id = (
            vehicle
            .assigned_incident
            .get(
                "id"
            )
        )


    if (
        current_incident_id
        ==
        incident_id
        and
        vehicle.follow_route
    ):

        return


    print(
        f"{vehicle.vehicle_id}: "
        "incident nou primit "
        f"{incident.get('incident_code')}"
    )


    vehicle.assign_incident(
        incident
    )


    try:

        movement.prepare_incident_route(
            vehicle
        )


        print(
            f"{vehicle.vehicle_id}: "
            "traseu pregătit către "
            f"{incident.get('latitude')}, "
            f"{incident.get('longitude')}"
        )


    except Exception as error:

        print(
            "Eroare la calcularea traseului "
            f"pentru {vehicle.vehicle_id}: "
            f"{error}"
        )


        vehicle.route = []

        vehicle.route_index = 0

        vehicle.follow_route = False


# =====================================
# HANDLE INCIDENT ARRIVAL
# =====================================

def handle_incident_arrival(
    vehicle,
    movement
):

    route_completed = (
        getattr(
            vehicle,
            "route_completed",
            False
        )
    )


    if not route_completed:

        return


    if not vehicle.assigned_incident:

        return


    incident_id = (
        vehicle
        .assigned_incident
        .get(
            "id"
        )
    )


    if not incident_id:

        return


    arrival_result = (
        notify_incident_arrived(
            vehicle,
            incident_id
        )
    )


    if not arrival_result:

        return


    print(
        f"{vehicle.vehicle_id}: "
        f"incidentul {incident_id} "
        "a fost închis."
    )


    vehicle.clear_incident()


    movement.return_to_random_movement(
        vehicle
    )


# =====================================
# SYNCHRONIZE SIMULATOR VEHICLES
# =====================================

def synchronize_simulator_vehicles(
    vehicles,
    road_network
):

    registered_vehicles = (
        get_simulator_vehicles()
    )


    if not registered_vehicles:

        return


    added_vehicles = (
        add_missing_vehicles(
            vehicles=
                vehicles,

            registered_vehicles=
                registered_vehicles,

            road_network=
                road_network
        )
    )


    if not added_vehicles:

        return


    for vehicle in added_vehicles:

        print(
            "Vehicul nou adăugat în simulator: "
            f"{vehicle.vehicle_id} "
            f"({vehicle.vehicle_type})"
        )


        print(
            "Poziție inițială: "
            f"lat={vehicle.latitude:.7f}, "
            f"lon={vehicle.longitude:.7f}, "
            f"speed={vehicle.speed:.2f}"
        )


        # Trimitem imediat prima poziție,
        # fără să așteptăm următorul ciclu.


        send_vehicle_data(
            vehicle
        )


# =====================================
# MAIN SIMULATOR
# =====================================

def main():

    print(
        "Pornire simulator GPS..."
    )


    network = (
        RoadNetwork()
    )


    vehicles = (
        create_vehicles(
            network,
            NUMBER_OF_VEHICLES
        )
    )


    movement = (
        MovementEngine(
            network
        )
    )


    print(
        "Simulator pornit."
    )


    print(
        "Vehicule active:",
        len(
            vehicles
        )
    )


    # =================================
    # SINCRONIZARE INIȚIALĂ
    # =================================

    synchronize_simulator_vehicles(
        vehicles,
        network
    )


    try:

        while True:

            # =================================
            # VERIFICĂ VEHICULE NOI
            # =================================

            synchronize_simulator_vehicles(
                vehicles,
                network
            )


            print(
                "\n--- ACTUALIZARE VEHICULE ---"
            )


            for vehicle in vehicles:

                synchronize_assignment(
                    vehicle,
                    movement
                )


                movement.move_vehicle(
                    vehicle
                )


                handle_incident_arrival(
                    vehicle,
                    movement
                )


                send_vehicle_data(
                    vehicle
                )


                movement_mode = (
                    "INCIDENT"
                    if vehicle.follow_route
                    else "RANDOM"
                )


                incident_code = "-"


                if vehicle.assigned_incident:

                    incident_code = (
                        vehicle
                        .assigned_incident
                        .get(
                            "incident_code",
                            "-"
                        )
                    )


                print(
                    f"{vehicle.vehicle_id} "
                    f"[{movement_mode}] "
                    f"incident={incident_code} "
                    f"lat={vehicle.latitude:.7f} "
                    f"lon={vehicle.longitude:.7f} "
                    f"speed={vehicle.speed:.2f}"
                )


            time.sleep(
                UPDATE_INTERVAL
            )


    except KeyboardInterrupt:

        print(
            "\nSimulator oprit."
        )


if __name__ == "__main__":

    main()