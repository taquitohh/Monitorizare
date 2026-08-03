import os

API_URL = os.getenv(
    "API_URL",
    "http://haproxy/api/vehicles"
)

NUMBER_OF_VEHICLES = 15

UPDATE_INTERVAL = 1

MIN_SPEED = 20.0

MAX_SPEED = 80.0

MAX_SPEED_CHANGE = 3.0

SIMULATION_NAME = "GPS Vehicle Simulator"