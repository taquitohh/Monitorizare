import random


class MovementEngine:

    def __init__(self, road_network):

        self.road_network = road_network

        # Cât de aproape trebuie să fie vehiculul
        # de un nod pentru a-l considera atins.
        self.node_arrival_threshold = 0.00005

        # Aproximativ 20–30 metri.
        self.incident_arrival_threshold_km = 0.03


    # =====================================
    # PREPARE INCIDENT ROUTE
    # =====================================

    def prepare_incident_route(
        self,
        vehicle
    ):

        if not vehicle.destination:

            raise ValueError(
                "Vehiculul nu are o destinație."
            )

        destination_latitude = float(
            vehicle.destination[0]
        )

        destination_longitude = float(
            vehicle.destination[1]
        )

        route_result = (
            self.road_network.calculate_route(
                vehicle.latitude,
                vehicle.longitude,
                destination_latitude,
                destination_longitude
            )
        )

        route_nodes = route_result.get(
            "nodes",
            []
        )

        if not route_nodes:

            raise RuntimeError(
                "Traseul incidentului este gol."
            )

        vehicle.route = route_nodes

        vehicle.route_index = 0

        vehicle.follow_route = True

        # Acest atribut ne ajută să nu
        # recalculăm permanent același traseu
        # după ce mașina a ajuns.
        vehicle.route_completed = False

        vehicle.previous_node = None

        vehicle.current_node = (
            route_nodes[0]
        )

        if len(route_nodes) > 1:

            vehicle.next_node = (
                route_nodes[1]
            )

            vehicle.route_index = 1

        else:

            vehicle.next_node = None

        print(
            f"{vehicle.vehicle_id}: "
            f"traseu incident cu "
            f"{len(route_nodes)} noduri."
        )


    # =====================================
    # RETURN TO RANDOM MOVEMENT
    # =====================================

    def return_to_random_movement(
        self,
        vehicle
    ):

        vehicle.route = []

        vehicle.route_index = 0

        vehicle.follow_route = False

        vehicle.route_completed = False

        nearest_node = (
            self.road_network.find_nearest_node(
                vehicle.latitude,
                vehicle.longitude
            )
        )

        vehicle.current_node = (
            nearest_node
        )

        vehicle.previous_node = None

        vehicle.next_node = (
            self.road_network.get_random_neighbor(
                vehicle.current_node,
                vehicle.previous_node
            )
        )


    # =====================================
    # MOVE VEHICLE
    # =====================================

    def move_vehicle(
        self,
        vehicle,
        time_step=1.0
    ):

        route_completed = getattr(
            vehicle,
            "route_completed",
            False
        )

        # După sosire, mașina poate continua
        # să circule aleatoriu.
        if route_completed:

            self._move_randomly(
                vehicle,
                time_step
            )

            return

        if (
            vehicle.follow_route
            and
            vehicle.route
        ):

            self._move_on_incident_route(
                vehicle,
                time_step
            )

        else:

            self._move_randomly(
                vehicle,
                time_step
            )

        self._update_speed(
            vehicle
        )


    # =====================================
    # MOVE ON INCIDENT ROUTE
    # =====================================

    def _move_on_incident_route(
        self,
        vehicle,
        time_step
    ):

        if self._has_reached_incident(
            vehicle
        ):

            self._finish_incident_route(
                vehicle
            )

            return

        if vehicle.next_node is None:

            self._advance_route_node(
                vehicle
            )

            if vehicle.next_node is None:

                self._move_directly_to_incident(
                    vehicle
                )

                return

        next_latitude, next_longitude = (
            self.road_network.get_coordinates(
                vehicle.next_node
            )
        )

        movement_factor = random.uniform(
            0.12,
            0.28
        )

        movement_factor *= max(
            0.5,
            float(time_step)
        )

        movement_factor = min(
            movement_factor,
            0.65
        )

        vehicle.latitude += (
            next_latitude
            -
            vehicle.latitude
        ) * movement_factor

        vehicle.longitude += (
            next_longitude
            -
            vehicle.longitude
        ) * movement_factor

        distance_to_node = (
            abs(
                next_latitude
                -
                vehicle.latitude
            )
            +
            abs(
                next_longitude
                -
                vehicle.longitude
            )
        )

        if (
            distance_to_node
            <
            self.node_arrival_threshold
        ):

            vehicle.latitude = (
                next_latitude
            )

            vehicle.longitude = (
                next_longitude
            )

            vehicle.previous_node = (
                vehicle.current_node
            )

            vehicle.current_node = (
                vehicle.next_node
            )

            self._advance_route_node(
                vehicle
            )

        if self._has_reached_incident(
            vehicle
        ):

            self._finish_incident_route(
                vehicle
            )


    # =====================================
    # ADVANCE ROUTE NODE
    # =====================================

    def _advance_route_node(
        self,
        vehicle
    ):

        next_index = (
            vehicle.route_index + 1
        )

        if (
            next_index
            <
            len(vehicle.route)
        ):

            vehicle.route_index = (
                next_index
            )

            vehicle.next_node = (
                vehicle.route[
                    next_index
                ]
            )

        else:

            vehicle.next_node = None


    # =====================================
    # MOVE DIRECTLY TO INCIDENT
    # =====================================

    def _move_directly_to_incident(
        self,
        vehicle
    ):

        if not vehicle.destination:

            self._finish_incident_route(
                vehicle
            )

            return

        destination_latitude = float(
            vehicle.destination[0]
        )

        destination_longitude = float(
            vehicle.destination[1]
        )

        movement_factor = random.uniform(
            0.18,
            0.35
        )

        vehicle.latitude += (
            destination_latitude
            -
            vehicle.latitude
        ) * movement_factor

        vehicle.longitude += (
            destination_longitude
            -
            vehicle.longitude
        ) * movement_factor

        if self._has_reached_incident(
            vehicle
        ):

            vehicle.latitude = (
                destination_latitude
            )

            vehicle.longitude = (
                destination_longitude
            )

            self._finish_incident_route(
                vehicle
            )


    # =====================================
    # CHECK INCIDENT ARRIVAL
    # =====================================

    def _has_reached_incident(
        self,
        vehicle
    ):

        if not vehicle.destination:

            return False

        destination_latitude = float(
            vehicle.destination[0]
        )

        destination_longitude = float(
            vehicle.destination[1]
        )

        distance_km = (
            self.road_network
            .calculate_haversine_distance(
                vehicle.latitude,
                vehicle.longitude,
                destination_latitude,
                destination_longitude
            )
        )

        return (
            distance_km
            <=
            self.incident_arrival_threshold_km
        )


    # =====================================
    # FINISH INCIDENT ROUTE
    # =====================================

    def _finish_incident_route(
        self,
        vehicle
    ):

        if vehicle.destination:

            vehicle.latitude = float(
                vehicle.destination[0]
            )

            vehicle.longitude = float(
                vehicle.destination[1]
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
            f"{vehicle.vehicle_id}: "
            f"a ajuns la incidentul "
            f"{incident_code}."
        )

        vehicle.route = []

        vehicle.route_index = 0

        vehicle.next_node = None

        # Păstrăm follow_route=True pentru ca
        # main.py să nu recalculeze același
        # incident la următoarea actualizare.
        vehicle.follow_route = True

        vehicle.route_completed = True

        nearest_node = (
            self.road_network.find_nearest_node(
                vehicle.latitude,
                vehicle.longitude
            )
        )

        vehicle.current_node = (
            nearest_node
        )

        vehicle.previous_node = None

        vehicle.next_node = (
            self.road_network.get_random_neighbor(
                vehicle.current_node,
                vehicle.previous_node
            )
        )

        vehicle.speed = random.uniform(
            10.0,
            25.0
        )


    # =====================================
    # RANDOM MOVEMENT
    # =====================================

    def _move_randomly(
        self,
        vehicle,
        time_step
    ):

        if vehicle.next_node is None:

            vehicle.next_node = (
                self.road_network
                .get_random_neighbor(
                    vehicle.current_node,
                    vehicle.previous_node
                )
            )

            if vehicle.next_node is None:

                return

        next_latitude, next_longitude = (
            self.road_network.get_coordinates(
                vehicle.next_node
            )
        )

        movement_factor = random.uniform(
            0.05,
            0.20
        )

        movement_factor *= max(
            0.5,
            float(time_step)
        )

        movement_factor = min(
            movement_factor,
            0.50
        )

        vehicle.latitude += (
            next_latitude
            -
            vehicle.latitude
        ) * movement_factor

        vehicle.longitude += (
            next_longitude
            -
            vehicle.longitude
        ) * movement_factor

        distance_to_target = (
            abs(
                next_latitude
                -
                vehicle.latitude
            )
            +
            abs(
                next_longitude
                -
                vehicle.longitude
            )
        )

        if (
            distance_to_target
            <
            self.node_arrival_threshold
        ):

            vehicle.latitude = (
                next_latitude
            )

            vehicle.longitude = (
                next_longitude
            )

            vehicle.previous_node = (
                vehicle.current_node
            )

            vehicle.current_node = (
                vehicle.next_node
            )

            vehicle.next_node = (
                self.road_network
                .get_random_neighbor(
                    vehicle.current_node,
                    vehicle.previous_node
                )
            )

        self._update_speed(
            vehicle
        )


    # =====================================
    # UPDATE SPEED
    # =====================================

    def _update_speed(
        self,
        vehicle
    ):

        vehicle.speed += random.uniform(
            -2.0,
            2.0
        )

        vehicle.speed = max(
            10.0,
            min(
                vehicle.speed,
                80.0
            )
        )