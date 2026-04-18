import asyncio
import json
import depthai as dai
from fastapi import FastAPI, WebSocket
import uvicorn

from faker import build_payload, init_cars, update_cars

app = FastAPI()

# GLOBAL storage for latest detections
latest_detections = []

# -----------------------------
# BACKGROUND TASK (OAK LOOP)
# -----------------------------
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

            detections = []
            for det in nn_msg.detections:
                detections.append({
                    "label": det.labelName,
                    "confidence": float(det.confidence),
                    "xmin": float(det.xmin),
                    "ymin": float(det.ymin),
                    "xmax": float(det.xmax),
                    "ymax": float(det.ymax),
                })


            latest_detections = detections

            await asyncio.sleep(0.01)
# -----------------------------
# WEBSOCKET
# -----------------------------
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
async def websocket_endpoint(websocket: WebSocket):
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


# -----------------------------
# STARTUP EVENT
# -----------------------------
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(oak_loop())


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)