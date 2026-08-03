import random


VEHICLE_TYPES = [
    "police",
    "ambulance",
    "fire"
]


class Vehicle:

    def __init__(self, vehicle_id, road_network):

        self.vehicle_id = vehicle_id

        self.vehicle_type = random.choice(
            VEHICLE_TYPES
        )

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

    def assign_incident(self, incident):

        self.assigned_incident = incident

        self.destination = (

            incident["latitude"],
            incident["longitude"]

        )

    # ==================================
    # CLEAR INCIDENT
    # ==================================

    def clear_incident(self):

        self.assigned_incident = None

        self.destination = None

        self.route = []

        self.route_index = 0

        self.follow_route = False

    # ==================================
    # DATA SENT TO BACKEND
    # ==================================

    def get_data(self):

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


# ======================================
# CREATE VEHICLES
# ======================================

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

            vehicle_id,

            road_network

        )

        vehicles.append(
            vehicle
        )

    return vehicles