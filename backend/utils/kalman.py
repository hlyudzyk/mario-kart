import numpy as np


class KalmanTracker:
    """
    Per-track Kalman filter with constant-velocity model.
    State vector: [x, y, vx, vy]
    Observation:  [x, y]
    """
    def __init__(self, x: float, y: float):
        self.F = np.array([         # state transition
            [1, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ], dtype=float)

        self.H = np.array([         # observation model
            [1, 0, 0, 0],
            [0, 1, 0, 0],
        ], dtype=float)

        self.Q = np.eye(4) * 1e-3   # process noise  — tune for more/less lag
        self.R = np.eye(2) * 1e-2   # measurement noise — tune for more/less smoothing

        self.P = np.eye(4) * 1.0    # initial covariance
        self.x = np.array([x, y, 0.0, 0.0], dtype=float)   # initial state

    def predict(self):
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q

    def update(self, x_meas: float, y_meas: float):
        z = np.array([x_meas, y_meas])
        y = z - self.H @ self.x                             # innovation
        S = self.H @ self.P @ self.H.T + self.R             # innovation covariance
        K = self.P @ self.H.T @ np.linalg.inv(S)           # Kalman gain
        self.x = self.x + K @ y
        self.P = (np.eye(4) - K @ self.H) @ self.P

    def position(self) -> tuple[float, float]:
        return float(self.x[0]), float(self.x[1])

kalman_filters: dict[int, KalmanTracker] = {}

def update_kalman(track_id: int, x: float, y: float) -> tuple[float, float]:
    if track_id not in kalman_filters:
        kalman_filters[track_id] = KalmanTracker(x, y)     # seed with first observation

    kf = kalman_filters[track_id]
    kf.predict()
    kf.update(x, y)
    return kf.position()

def prune_kalman(active_ids: set[int]):
    """Remove filters for tracks that have disappeared."""
    stale = [tid for tid in kalman_filters if tid not in active_ids]
    for tid in stale:
        del kalman_filters[tid]
