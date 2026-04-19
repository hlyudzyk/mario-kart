import math

from backend.constants import Y_MIN, Y_MAX


def compute_position(det: dict) -> dict | None:
    cx = (det["xmin"] + det["xmax"]) / 2
    width = det["xmax"] - det["xmin"]
    height = det["ymax"] - det["ymin"]
    area = width * height
    if area <= 0:
        return None

    x = cx
    y_raw = 1 / math.sqrt(area)
    y = (y_raw - Y_MIN) / (Y_MAX - Y_MIN)
    y = max(0.0, min(1.0, y))

    return {"x": x, "y": y}