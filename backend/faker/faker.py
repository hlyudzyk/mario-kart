import json
import random
import time
from dataclasses import dataclass, asdict

MAX_DELTA = 0.01
NUM_CARS = 3
SEND_INTERVAL = 5  # seconds


@dataclass
class Car:
    x: float       # 0-1
    y: float       # 0-1
    width: float   # 0-1
    height: float  # 0-1


def clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def smooth_move(current: float, min_val: float, max_val: float) -> float:
    delta = random.uniform(-MAX_DELTA, MAX_DELTA)
    return clamp(current + delta, min_val, max_val)


def init_cars() -> list[Car]:
    cars = []
    for _ in range(NUM_CARS):
        width = random.uniform(0.05, 0.2)
        height = width * random.uniform(0.8, 1.2)  # roughly square-ish
        cars.append(Car(
            x=random.uniform(0.1, 0.9),
            y=random.uniform(0.1, 0.9),
            width=width,
            height=height,
        ))
    return cars


def update_cars(cars: list[Car]) -> list[Car]:
    for car in cars:
        # car.x = smooth_move(car.x, 0.0, 1.0)
        car.y = smooth_move(car.y, 0.3, 0.7)

        # width and height scale together to preserve aspect ratio
        aspect = car.height / car.width
        car.width = clamp(car.width + random.uniform(-0.01, 0.01), 0.02, 0.4)
        car.height = clamp(car.width * aspect, 0.02, 0.4)
    return cars


def build_payload(cars: list[Car]) -> str:
    return json.dumps([asdict(car) for car in cars])

def give_me_payload():
    cars = init_cars()
    cars = update_cars(cars)
    print(build_payload(cars))
    time.sleep(SEND_INTERVAL)

if __name__ == "__main__":
    cars = init_cars()
    while True:
        cars = update_cars(cars)
        print(build_payload(cars))
        time.sleep(SEND_INTERVAL)