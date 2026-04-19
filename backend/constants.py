from enum import Enum

Y_MIN = 1.0
Y_MAX = 8.0
REQUEST_OUTPUT_WIDTH = 512
REQUEST_OUTPUT_HEIGHT = 288

class DetectedObject(Enum):
    PERSON = "person"
    CAR = "car"