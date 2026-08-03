import math
import os
import random

import networkx as nx


GRAPH_FILE = os.path.join(
    os.path.dirname(__file__),
    "data",
    "road_network.graphml"
)


class RoadNetwork:

    def __init__(self):

        print(
            "Se incarca reteaua de drumuri..."
        )

        self.graph = nx.read_graphml(
            GRAPH_FILE
        )

        self._normalize_edge_lengths()

        print(
            f"Retea incarcata: "
            f"{self.graph.number_of_nodes()} noduri, "
            f"{self.graph.number_of_edges()} drumuri"
        )

    # =====================================
    # NORMALIZE EDGE LENGTHS
    # =====================================

    def _normalize_edge_lengths(self):

        if self.graph.is_multigraph():

            for (
                start_node,
                end_node,
                edge_key,
                edge_data
            ) in self.graph.edges(
                keys=True,
                data=True
            ):

                edge_data["length"] = (
                    self._parse_length(
                        edge_data.get(
                            "length"
                        )
                    )
                )

        else:

            for (
                start_node,
                end_node,
                edge_data
            ) in self.graph.edges(
                data=True
            ):

                edge_data["length"] = (
                    self._parse_length(
                        edge_data.get(
                            "length"
                        )
                    )
                )

    def _parse_length(
        self,
        value
    ):

        try:

            return float(
                value
            )

        except (
            TypeError,
            ValueError
        ):

            return 1.0

    # =====================================
    # RANDOM MOVEMENT HELPERS
    # =====================================

    def get_random_node(self):

        return random.choice(
            list(
                self.graph.nodes
            )
        )

    def get_neighbors(
        self,
        node_id
    ):

        return list(
            self.graph.neighbors(
                node_id
            )
        )

    def get_random_neighbor(
        self,
        node_id,
        previous_node=None
    ):

        neighbors = self.get_neighbors(
            node_id
        )

        if not neighbors:

            return None

        available_neighbors = [
            neighbor
            for neighbor in neighbors
            if neighbor != previous_node
        ]

        if not available_neighbors:

            available_neighbors = (
                neighbors
            )

        return random.choice(
            available_neighbors
        )

    # =====================================
    # NODE COORDINATES
    # =====================================

    def get_coordinates(
        self,
        node_id
    ):

        node_data = (
            self.graph.nodes[
                node_id
            ]
        )

        latitude = float(
            node_data["y"]
        )

        longitude = float(
            node_data["x"]
        )

        return (
            latitude,
            longitude
        )

    # =====================================
    # HAVERSINE DISTANCE
    # =====================================

    def calculate_haversine_distance(
        self,
        latitude_1,
        longitude_1,
        latitude_2,
        longitude_2
    ):

        earth_radius_km = 6371.0

        latitude_difference = (
            math.radians(
                latitude_2
                -
                latitude_1
            )
        )

        longitude_difference = (
            math.radians(
                longitude_2
                -
                longitude_1
            )
        )

        latitude_1_radians = (
            math.radians(
                latitude_1
            )
        )

        latitude_2_radians = (
            math.radians(
                latitude_2
            )
        )

        value = (
            math.sin(
                latitude_difference / 2
            ) ** 2
            +
            math.cos(
                latitude_1_radians
            )
            *
            math.cos(
                latitude_2_radians
            )
            *
            math.sin(
                longitude_difference / 2
            ) ** 2
        )

        angle = (
            2
            *
            math.atan2(
                math.sqrt(
                    value
                ),
                math.sqrt(
                    1 - value
                )
            )
        )

        return (
            earth_radius_km
            *
            angle
        )

    # =====================================
    # FIND NEAREST NODE
    # =====================================

    def find_nearest_node(
        self,
        latitude,
        longitude
    ):

        nearest_node = None

        shortest_distance = None

        for (
            node_id,
            node_data
        ) in self.graph.nodes(
            data=True
        ):

            if (
                "x" not in node_data
                or
                "y" not in node_data
            ):

                continue

            node_latitude = float(
                node_data["y"]
            )

            node_longitude = float(
                node_data["x"]
            )

            distance = (
                self.calculate_haversine_distance(
                    latitude,
                    longitude,
                    node_latitude,
                    node_longitude
                )
            )

            if (
                shortest_distance is None
                or
                distance
                <
                shortest_distance
            ):

                shortest_distance = (
                    distance
                )

                nearest_node = (
                    node_id
                )

        if nearest_node is None:

            raise RuntimeError(
                "Reteaua nu contine "
                "noduri cu coordonate valide."
            )

        return nearest_node

    # =====================================
    # ROUTE WEIGHT
    # =====================================

    def route_weight(
        self,
        start_node,
        end_node,
        edge_data
    ):

        if not edge_data:

            return 1.0

        if all(
            isinstance(
                value,
                dict
            )
            for value in edge_data.values()
        ):

            lengths = []

            for data in edge_data.values():

                try:

                    lengths.append(
                        float(
                            data.get(
                                "length",
                                1.0
                            )
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    continue

            if lengths:

                return min(
                    lengths
                )

            return 1.0

        try:

            return float(
                edge_data.get(
                    "length",
                    1.0
                )
            )

        except (
            TypeError,
            ValueError,
            AttributeError
        ):

            return 1.0

    # =====================================
    # SHORTEST ROUTE
    # =====================================

    def calculate_route(
        self,
        start_latitude,
        start_longitude,
        destination_latitude,
        destination_longitude
    ):

        start_node = (
            self.find_nearest_node(
                start_latitude,
                start_longitude
            )
        )

        destination_node = (
            self.find_nearest_node(
                destination_latitude,
                destination_longitude
            )
        )

        route_graph = (
            self.graph
        )

        try:

            route_nodes = (
                nx.shortest_path(
                    route_graph,
                    source=start_node,
                    target=destination_node,
                    weight=self.route_weight
                )
            )

        except (
            nx.NetworkXNoPath,
            nx.NodeNotFound
        ):

            route_graph = (
                self.graph.to_undirected()
            )

            route_nodes = (
                nx.shortest_path(
                    route_graph,
                    source=start_node,
                    target=destination_node,
                    weight=self.route_weight
                )
            )

        if not route_nodes:

            raise RuntimeError(
                "Nu s-a putut calcula traseul."
            )

        return {
            "graph":
                route_graph,

            "start_node":
                start_node,

            "destination_node":
                destination_node,

            "nodes":
                route_nodes
        }