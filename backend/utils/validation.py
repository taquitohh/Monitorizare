import math


def validate_coordinates(latitude, longitude):
    if not -90 <= latitude <= 90:
        raise ValueError("Latitude is invalid.")

    if not -180 <= longitude <= 180:
        raise ValueError("Longitude is invalid.")


def calculate_haversine_distance(latitude_1, longitude_1, latitude_2, longitude_2):
    earth_radius_km = 6371.0

    latitude_difference = math.radians(latitude_2 - latitude_1)
    longitude_difference = math.radians(longitude_2 - longitude_1)
    latitude_1_radians = math.radians(latitude_1)
    latitude_2_radians = math.radians(latitude_2)

    value = (
        math.sin(latitude_difference / 2) ** 2
        + math.cos(latitude_1_radians)
        * math.cos(latitude_2_radians)
        * math.sin(longitude_difference / 2) ** 2
    )

    angle = 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))

    return earth_radius_km * angle
