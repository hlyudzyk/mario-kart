import asyncio
import json
import random

from fastapi import FastAPI, WebSocket
import uvicorn

from backend.faker.faker import update_cars, init_cars, build_payload

app = FastAPI()

cars = init_cars()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")

    try:
        while True:
            # in_det = queue.get()

            # detections = []
            #
            # # for det in in_det.detections:
            # # coords = det.spatialCoordinates
            # for i in range(random.randint(1, 10)):
            #     detections.append({
            #         "label": "car", #det.label,
            #         "x": 1,#round(coords.x / 1000, 2),
            #         "y": 1,#round(coords.y / 1000, 2),
            #         "z": 0,#round(coords.z / 1000, 2),
            #         "confidence":1# round(det.confidence, 2)
            #     })

            updated_cars = update_cars(cars)
            detections = build_payload(updated_cars)
            print(detections)
            if detections:
                await websocket.send_text(detections)

            await asyncio.sleep(0.03)  # ~30 FPS

    except Exception as e:
        print("WebSocket closed:", e)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)