import random


VEHICLE_TYPES = [
    "police",
    "ambulance",
    "fire"
]


# =====================================
# VEHICLE
# =====================================

class Vehicle:


    def __init__(
        self,
        vehicle_id,
        road_network,
        vehicle_type=None
    ):

        self.vehicle_id = (
            vehicle_id
        )


        # ==================================
        # TIP VEHICUL
        # ==================================

        if (
            vehicle_type
            in
            VEHICLE_TYPES
        ):

            self.vehicle_type = (
                vehicle_type
            )

        else:

            self.vehicle_type = (
                random.choice(
                    VEHICLE_TYPES
                )
            )


        # ==================================
        # POZIȚIE INIȚIALĂ
        # ==================================

        self.current_node = (
            road_network.get_random_node()
        )


        self.previous_node = None


        self.next_node = (
            road_network.get_random_neighbor(
                self.current_node,
                self.previous_node
            )
        )


        self.latitude, self.longitude = (
            road_network.get_coordinates(
                self.current_node
            )
        )


        # ==================================
        # VITEZĂ
        # ==================================

        self.speed = random.uniform(
            25.0,
            60.0
        )


        self.status = "active"


        # ==================================
        # DISPATCH INFORMATION
        # ==================================

        self.assigned_incident = None

        self.destination = None

        self.route = []

        self.route_index = 0

        self.follow_route = False


    # ==================================
    # ASSIGN INCIDENT
    # ==================================

    def assign_incident(
        self,
        incident
    ):

        self.assigned_incident = (
            incident
        )


        self.destination = (
            incident["latitude"],
            incident["longitude"]
        )


    # ==================================
    # CLEAR INCIDENT
    # ==================================

    def clear_incident(
        self
    ):

        self.assigned_incident = None

        self.destination = None

        self.route = []

        self.route_index = 0

        self.follow_route = False


    # ==================================
    # DATA SENT TO BACKEND
    # ==================================

    def get_data(
        self
    ):

        return {

            "vehicle_id":
                self.vehicle_id,

            "vehicle_type":
                self.vehicle_type,

            "latitude":
                self.latitude,

            "longitude":
                self.longitude,

            "speed":
                round(
                    self.speed,
                    2
                ),

            "status":
                self.status

        }


# =====================================
# CREATE INITIAL VEHICLES
# =====================================

def create_vehicles(
    road_network,
    count=15
):

    vehicles = []


    for i in range(
        1,
        count + 1
    ):

        vehicle_id = (
            f"VEHICLE-{i:03d}"
        )


        vehicle = Vehicle(
            vehicle_id=
                vehicle_id,

            road_network=
                road_network
        )


        vehicles.append(
            vehicle
        )


    return vehicles


# =====================================
# CREATE VEHICLE FROM BACKEND DATA
# =====================================

def create_vehicle_from_data(
    road_network,
    vehicle_data
):

    if not isinstance(
        vehicle_data,
        dict
    ):

        return None


    vehicle_code = (
        vehicle_data.get(
            "vehicle_code"
        )
        or
        vehicle_data.get(
            "vehicle_id"
        )
    )


    vehicle_type = (
        vehicle_data.get(
            "vehicle_type"
        )
    )


    if not vehicle_code:

        return None


    vehicle_code = (
        str(
            vehicle_code
        )
        .strip()
        .upper()
    )


    if not vehicle_code:

        return None


    vehicle = Vehicle(
        vehicle_id=
            vehicle_code,

        road_network=
            road_network,

        vehicle_type=
            vehicle_type
    )


    return vehicle


# =====================================
# ADD MISSING VEHICLES
# =====================================

def add_missing_vehicles(
    vehicles,
    registered_vehicles,
    road_network
):

    if not isinstance(
        vehicles,
        list
    ):

        return []


    if not isinstance(
        registered_vehicles,
        list
    ):

        return []


    existing_vehicle_codes = {
        str(
            vehicle.vehicle_id
        ).strip().upper()
        for vehicle
        in vehicles
    }


    added_vehicles = []


    for vehicle_data in (
        registered_vehicles
    ):

        if not isinstance(
            vehicle_data,
            dict
        ):

            continue


        vehicle_code = (
            vehicle_data.get(
                "vehicle_code"
            )
            or
            vehicle_data.get(
                "vehicle_id"
            )
        )


        if not vehicle_code:

            continue


        vehicle_code = (
            str(
                vehicle_code
            )
            .strip()
            .upper()
        )


        if (
            vehicle_code
            in
            existing_vehicle_codes
        ):

            continue


        new_vehicle = (
            create_vehicle_from_data(
                road_network=
                    road_network,

                vehicle_data=
                    vehicle_data
            )
        )


        if not new_vehicle:

            continue


        vehicles.append(
            new_vehicle
        )


        existing_vehicle_codes.add(
            vehicle_code
        )


        added_vehicles.append(
            new_vehicle
        )


    return added_vehicles