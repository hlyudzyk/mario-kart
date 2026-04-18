# Agents.md

## Project Overview

We are building a mobile application that transforms a live dashcam feed into a **Mario Kart–style 2D driving experience**.

An OAK-D Lite camera streams live video and detected vehicle data to a mobile app. The app renders a stylized game-like scene on top of the real-world video, including grass, a player kart, and opponent karts representing real vehicles.

This is **not a realistic AR system** — it is a **game-inspired overlay** designed to be fun, visually clear, and achievable within a hackathon timeframe.

---

## Core Concept (v1)

* Live video is the base layer
* A 2D game scene is rendered on top
* The user is represented as a **player kart fixed near the bottom center**
* Real cars are represented as **opponent karts**
* All opponent karts use a **back-facing sprite only**
* Even incoming vehicles are visually treated as if we are overtaking them

This simplifies rendering while matching arcade-style gameplay conventions.

---

## System Architecture

### Camera / Backend

* OAK-D Lite captures:

  * RGB video stream
  * detected vehicles
  * spatial coordinates (x, y, z)
* Outputs:

  * **Video stream** (via WebRTC)
  * **Telemetry stream** (via WebSocket JSON)

Example payload:

```json
{
  "ts": 1713430000123,
  "carsList": [
    {
      "id": 12,
      "x": -1.4,
      "y": 0.0,
      "z": 18.2,
      "vx": 0.1,
      "vz": -0.4,
      "confidence": 0.91
    }
  ]
}
```

---

### Mobile Frontend

**Tech Stack**

* React Native
* WebRTC (video streaming)
* WebSocket (telemetry)
* @shopify/react-native-skia (2D rendering)
* react-native-reanimated (animations & smoothing)

---

## Rendering Model

The app uses a **layered 2D rendering approach**:

1. Video Layer (background)
2. Game Overlay Canvas (Skia)

   * Grass / environment
   * Opponent karts
   * Player kart
   * HUD (optional)

---

## Coordinate Mapping

Backend provides positions relative to the camera:

* `x`: horizontal offset
* `z`: distance forward

Frontend projects these into screen space:

* `screenX = centerX + f * (x / z)`
* `scale = k / z`

`screenY` is approximated using a depth curve (not true geometry) to simulate perspective.

---

## Kart Representation

Each opponent is rendered as a simple 2D rig:

* Body sprite (back view only in v1)
* Two wheel sprites (rotating)
* Shadow (optional)

### Animation

* Wheels rotate continuously
* Slight vertical bob or scaling based on movement
* Position smoothed using velocity and interpolation

---

## Frontend Responsibilities

* Render live video stream
* Maintain real-time WebSocket connection
* Transform telemetry into screen positions
* Smooth movement to reduce jitter
* Render karts with scaling and animation
* Keep player kart fixed on screen

---

## v1 Scope (Must Have)

* Live video stream
* Grass background
* Player kart (bottom center)
* Opponent karts (back view only)
* Distance-based scaling
* Wheel rotation animation
* Stable tracking using `id`

---

## v2 Scope (If Time Allows)

* Add road (fake perspective trapezoid)
* Lane markings
* Shadows under karts
* Speed / rank UI
* Better smoothing & interpolation

---

## Non-Goals (Hackathon)

* No full 3D rendering
* No SLAM or world mapping
* No accurate scene reconstruction
* No real object-to-environment mapping (houses, lanes, etc.)

---

## Key Design Decisions

* **2D over 3D**: faster, safer, easier to polish
* **Back-view only karts**: avoids angle complexity
* **Game feel over realism**
* **Fake perspective instead of real-world reconstruction**

---

## Success Criteria

* Smooth live video on mobile
* Multiple cars tracked and rendered
* Karts move consistently and feel stable
* Visual result clearly resembles a racing game
* Demo is reliable under real conditions

---

## Team Split Suggestion

**Backend (2 people)**

* OAK pipeline (detection, tracking, depth)
* Video streaming (WebRTC)
* Telemetry API (WebSocket)

**Frontend (2 people)**

* Video rendering + overlay system
* Game visuals (karts, animations, HUD)

---

## Final Goal

Deliver a **compelling live demo** where real-world traffic is transformed into a playful Mario Kart–style experience using a 2D overlay system.
