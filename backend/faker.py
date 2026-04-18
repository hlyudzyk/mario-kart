import json
import random
import time
from dataclasses import dataclass, asdict

MAX_DELTA = 0.01
NUM_CARS = 4
SEND_INTERVAL = 5  # seconds


@dataclass
class Car:
    x: float       # 0-1
    y: float       # 0-1
    id: int
    label: str


def clamp(value: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, value))


def smooth_move(current: float, min_val: float, max_val: float) -> float:
    delta = random.uniform(-MAX_DELTA, MAX_DELTA)
    return clamp(current + delta, min_val, max_val)


def init_cars() -> list[Car]:
    cars = []
    car_id = 0
    for _ in range(NUM_CARS):
        cars.append(Car(
            x=random.uniform(0.1, 0.9),
            y=random.uniform(0.1, 0.9),
            id=car_id + 1,
            label="car"
        ))
        car_id += 1
    return cars


def update_cars(cars: list[Car]) -> list[Car]:
    for car in cars:
        # car.x = smooth_move(car.x, 0.0, 1.0)
        car.y = smooth_move(car.y, 0.3, 0.7)

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