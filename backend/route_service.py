import math
import os

import networkx as nx


ROAD_GRAPH_FILE = os.getenv(
    "ROAD_GRAPH_FILE",
    os.path.join(
        os.path.dirname(__file__),
        "data",
        "road_network.graphml"
    )
)


class RouteService:

    def __init__(
        self,
        graph_file=ROAD_GRAPH_FILE
    ):

        self.graph_file = graph_file

        self.graph = None


    def get_graph(self):

        if self.graph is None:

            if not os.path.exists(
                self.graph_file
            ):

                raise FileNotFoundError(
                    f"Road graph was not found: "
                    f"{self.graph_file}"
                )

            self.graph = nx.read_graphml(
                self.graph_file
            )

            self._normalize_edge_lengths()

        return self.graph


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


    def get_node_coordinates(
        self,
        graph,
        node_id
    ):

        node_data = graph.nodes[
            node_id
        ]

        return (
            float(
                node_data["y"]
            ),
            float(
                node_data["x"]
            )
        )


    def calculate_haversine_distance(
        self,
        latitude_1,
        longitude_1,
        latitude_2,
        longitude_2
    ):

        earth_radius_km = 6371.0

        latitude_difference = math.radians(
            latitude_2 - latitude_1
        )

        longitude_difference = math.radians(
            longitude_2 - longitude_1
        )

        latitude_1_radians = math.radians(
            latitude_1
        )

        latitude_2_radians = math.radians(
            latitude_2
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
                math.sqrt(value),
                math.sqrt(1 - value)
            )
        )

        return (
            earth_radius_km
            *
            angle
        )


    def find_nearest_node(
        self,
        graph,
        latitude,
        longitude
    ):

        nearest_node = None

        shortest_distance = None

        for (
            node_id,
            node_data
        ) in graph.nodes(
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
                distance < shortest_distance
            ):

                shortest_distance = (
                    distance
                )

                nearest_node = (
                    node_id
                )

        if nearest_node is None:

            raise RuntimeError(
                "The road graph does not "
                "contain valid coordinates."
            )

        return nearest_node


    def get_edge_length(
        self,
        graph,
        start_node,
        end_node
    ):

        edge_data = (
            graph.get_edge_data(
                start_node,
                end_node
            )
        )

        if edge_data is None:

            return 0.0

        if graph.is_multigraph():

            lengths = []

            for data in (
                edge_data.values()
            ):

                try:

                    lengths.append(
                        float(
                            data.get(
                                "length",
                                0.0
                            )
                        )
                    )

                except (
                    TypeError,
                    ValueError
                ):

                    continue

            return (
                min(lengths)
                if lengths
                else 0.0
            )

        try:

            return float(
                edge_data.get(
                    "length",
                    0.0
                )
            )

        except (
            TypeError,
            ValueError
        ):

            return 0.0


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

            for data in (
                edge_data.values()
            ):

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

            return (
                min(lengths)
                if lengths
                else 1.0
            )

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


    def calculate_route(
        self,
        vehicle_latitude,
        vehicle_longitude,
        incident_latitude,
        incident_longitude
    ):

        graph = self.get_graph()

        start_node = (
            self.find_nearest_node(
                graph,
                vehicle_latitude,
                vehicle_longitude
            )
        )

        end_node = (
            self.find_nearest_node(
                graph,
                incident_latitude,
                incident_longitude
            )
        )

        route_graph = graph

        try:

            route_nodes = (
                nx.shortest_path(
                    route_graph,
                    source=start_node,
                    target=end_node,
                    weight=self.route_weight
                )
            )

        except (
            nx.NetworkXNoPath,
            nx.NodeNotFound
        ):

            route_graph = (
                graph.to_undirected()
            )

            route_nodes = (
                nx.shortest_path(
                    route_graph,
                    source=start_node,
                    target=end_node,
                    weight=self.route_weight
                )
            )

        coordinates = [
            [
                vehicle_latitude,
                vehicle_longitude
            ]
        ]

        for node_id in route_nodes:

            latitude, longitude = (
                self.get_node_coordinates(
                    route_graph,
                    node_id
                )
            )

            coordinates.append([
                latitude,
                longitude
            ])

        coordinates.append([
            incident_latitude,
            incident_longitude
        ])

        distance_meters = (
            self._calculate_route_distance(
                route_graph,
                route_nodes,
                vehicle_latitude,
                vehicle_longitude,
                incident_latitude,
                incident_longitude
            )
        )

        return {
            "start_node":
                str(start_node),

            "end_node":
                str(end_node),

            "node_count":
                len(route_nodes),

            "distance_meters":
                round(
                    distance_meters,
                    2
                ),

            "distance_km":
                round(
                    distance_meters / 1000,
                    3
                ),

            "coordinates":
                coordinates
        }


    def _calculate_route_distance(
        self,
        graph,
        route_nodes,
        vehicle_latitude,
        vehicle_longitude,
        incident_latitude,
        incident_longitude
    ):

        distance_meters = 0.0

        start_latitude, start_longitude = (
            self.get_node_coordinates(
                graph,
                route_nodes[0]
            )
        )

        distance_meters += (
            self.calculate_haversine_distance(
                vehicle_latitude,
                vehicle_longitude,
                start_latitude,
                start_longitude
            )
            *
            1000
        )

        for index in range(
            len(route_nodes) - 1
        ):

            current_node = (
                route_nodes[index]
            )

            next_node = (
                route_nodes[
                    index + 1
                ]
            )

            edge_length = (
                self.get_edge_length(
                    graph,
                    current_node,
                    next_node
                )
            )

            if edge_length <= 0:

                current_latitude, current_longitude = (
                    self.get_node_coordinates(
                        graph,
                        current_node
                    )
                )

                next_latitude, next_longitude = (
                    self.get_node_coordinates(
                        graph,
                        next_node
                    )
                )

                edge_length = (
                    self.calculate_haversine_distance(
                        current_latitude,
                        current_longitude,
                        next_latitude,
                        next_longitude
                    )
                    *
                    1000
                )

            distance_meters += (
                edge_length
            )

        end_latitude, end_longitude = (
            self.get_node_coordinates(
                graph,
                route_nodes[-1]
            )
        )

        distance_meters += (
            self.calculate_haversine_distance(
                end_latitude,
                end_longitude,
                incident_latitude,
                incident_longitude
            )
            *
            1000
        )

        return distance_meters