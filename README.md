# 🏎️ MarioCar: Open World

> *Your street. Your racetrack.*

MarioCar: Open World is a real-time mixed-reality experience that transforms your physical surroundings into a living Mario Kart racing world.

---

## 🎮 What is it?

Using a **Luxonis OAK-D** camera, the system scans the environment, detecting people and cars in the scene and tracking each one with a persistent identity. Every detected object becomes an obstacle or rival racer on a dynamic top-down map.

- 🚗 **Cars** are rendered as Mario Kart characters
- 🪙 **Pedestrians** are rendered as coins
- 📍 **Your car** sits at the bottom center of the minimap
- 🔴 Nearby objects glow **red**, mid-range **orange**, distant **green**

Tracks persist across frames — rivals don't flicker in and out of existence.

---

## ⚙️ How it works

```
OAK-D Camera
    │
    ├── Stereo Depth  ──────────────────────────────────┐
    │                                                   │
    └── YOLOv6 Detection Network                        │
            │                                           │
            ▼                                           ▼
      Object Tracking (ID)  +  Real-world X/Y/Z coords (mm)
            │
            ▼
      Kalman Filter  (smooth trajectories)
            │
            ▼
      FastAPI Backend  (WebSocket, 30fps)
            │
            ▼
      React Native App  (Mario Kart minimap)
```

| Component | Technology |
|---|---|
| Camera & Depth | Luxonis OAK-D, DepthAI v3 |
| Detection | YOLOv6 Spatial Detection Network |
| Tracking | DepthAI ObjectTracker + Kalman Filter |
| Backend | Python, FastAPI, WebSocket |
| Frontend | React Native |

---

## 🧠 Under the hood

A **YOLOv6 spatial detection network** fuses RGB inference with stereo depth to produce accurate real-world coordinates for every detected object. A **Kalman filter** smooths each track's trajectory across frames, eliminating the jitter typical of bounding-box-based approaches. A **FastAPI backend** streams the processed point array over WebSocket at 30fps, while a lightweight React Native app renders the game.

---

## 🔭 Beyond the game

> This project is a **proof of concept** — a deliberately playful demonstration of what becomes possible when a detection network is paired with real-time data streaming.

The interface is intentionally simple. The underlying pipeline is not.

The same object identities, real-world coordinates, and per-track trajectories that power a game minimap could equally drive:

- 🚶 Pedestrian collision warning systems
- 🅿️ Autonomous parking assistants
- 🤖 Warehouse robot awareness layers
- 🛍️ Retail footfall heatmaps
- ♿ Spatial narration aids for visually impaired users

Computer vision and modern detection networks have matured to the point where the hard problem is **no longer detecting and locating objects** — it is deciding **what interface to build on top of that data**.

*MarioCar asks that question with a smile.* 🍄