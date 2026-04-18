import asyncio
import json
import math
import depthai as dai
from fastapi import FastAPI, WebSocket
import uvicorn
from faker import build_payload, init_cars, update_cars

app = FastAPI()

latest_detections = []


def compute_position(det: dict) -> dict | None:
    cx = (det["xmin"] + det["xmax"]) / 2
    width = det["xmax"] - det["xmin"]
    height = det["ymax"] - det["ymin"]

    area = width * height
    if area <= 0:
        return None

    # -------------------------
    # X in [0, 1]
    # -------------------------
    x = cx

    # -------------------------
    # Z raw (distance proxy)
    # -------------------------
    z_raw = 1 / math.sqrt(area)

    # -------------------------
    # Normalize Z → [0, 1]
    # -------------------------
    Z_MIN = 1.0  # tune this
    Z_MAX = 8.0  # tune this

    z = (z_raw - Z_MIN) / (Z_MAX - Z_MIN)
    z = max(0.0, min(1.0, z))

    return {
        "x": round(x, 3),
        "z": round(z, 3)
    }

async def oak_loop():
    global latest_detections
    device = dai.Device()
    with dai.Pipeline(device) as pipeline:
        model_description = dai.NNModelDescription.fromYamlFile(
            f"yolov6_nano_r2_coco.{device.getPlatform().name}.yaml"
        )
        nn_archive = dai.NNArchive(dai.getModelFromZoo(model_description))
        cameraNode = pipeline.create(dai.node.Camera).build(dai.CameraBoardSocket.CAM_A)
        detectionNetwork = pipeline.create(dai.node.DetectionNetwork)
        cameraNode.requestOutput((512, 288), dai.ImgFrame.Type.BGR888p).link(
            detectionNetwork.input
        )
        detectionNetwork.setNNArchive(nn_archive, numShaves=4)
        nnout = detectionNetwork.out.createOutputQueue()
        pipeline.start()
        while pipeline.isRunning():
            nn_msg = nnout.get()
            points = []
            for det in nn_msg.detections:
                raw = {
                    "xmin": float(det.xmin),
                    "ymin": float(det.ymin),
                    "xmax": float(det.xmax),
                    "ymax": float(det.ymax),
                }
                pos = compute_position(raw)
                pos["label"] = det.labelName
                if pos:
                    points.append(pos)
            latest_detections = points
            await asyncio.sleep(0.01)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")
    try:
        while True:
            await websocket.send_text(json.dumps(latest_detections))
            await asyncio.sleep(0.03)
    except Exception as e:
        print("WebSocket closed:", e)

@app.websocket("/wsTest")
async def websocket_test_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client test connected")
    try:
        cars = init_cars()
        while True:
            cars = update_cars(cars)
            payload = build_payload(cars)
            await websocket.send_text(payload)
            await asyncio.sleep(0.1)
    except Exception as e:
        print("WebSocket test closed:", e)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(oak_loop())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)