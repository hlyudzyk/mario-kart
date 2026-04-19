import asyncio
import json
import depthai as dai
from fastapi import FastAPI, WebSocket
import uvicorn

from constants import REQUEST_OUTPUT_HEIGHT, REQUEST_OUTPUT_WIDTH
from utils.kalman import update_kalman, prune_kalman
from utils.positioning import compute_position
from faker import build_payload, init_cars, update_cars
app = FastAPI()

latest_detections = []

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
        cameraNode.requestOutput(
            (REQUEST_OUTPUT_WIDTH, REQUEST_OUTPUT_HEIGHT), dai.ImgFrame.Type.BGR888p
        ).link(detectionNetwork.input)
        detectionNetwork.setNNArchive(nn_archive, numShaves=4)

        objectTracker = pipeline.create(dai.node.ObjectTracker)
        objectTracker.setDetectionLabelsToTrack([0, 2])
        objectTracker.setTrackerType(dai.TrackerType.ZERO_TERM_COLOR_HISTOGRAM)
        objectTracker.setTrackerIdAssignmentPolicy(dai.TrackerIdAssignmentPolicy.UNIQUE_ID)
        detectionNetwork.passthrough.link(objectTracker.inputTrackerFrame)
        detectionNetwork.passthrough.link(objectTracker.inputDetectionFrame)
        detectionNetwork.out.link(objectTracker.inputDetections)
        trackerOut = objectTracker.out.createOutputQueue()

        pipeline.start()
        while pipeline.isRunning():
            tracklets_msg = trackerOut.get()
            points = []
            active_ids = set()

            for t in tracklets_msg.tracklets:
                if t.status == dai.Tracklet.TrackingStatus.LOST:
                    continue

                label_name = t.label
                if label_name == 0:
                    label_str = "person"
                elif label_name == 2:
                    label_str = "car"
                else:
                    continue

                raw = {
                    "xmin": float(t.roi.x),
                    "ymin": float(t.roi.y),
                    "xmax": float(t.roi.x + t.roi.width),
                    "ymax": float(t.roi.y + t.roi.height),
                }
                pos = compute_position(raw)
                if not pos:
                    continue

                sx, sy = update_kalman(t.id, pos["x"], pos["y"])
                sx = max(0.0, min(1.0, sx))
                sy = max(0.0, min(1.0, sy))

                active_ids.add(t.id)
                points.append({
                    "id": t.id,
                    "label": label_str,
                    "x": round(sx, 3),
                    "y": round(sy, 3),
                })

            prune_kalman(active_ids)
            latest_detections = points
            await asyncio.sleep(0.03)

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
            await asyncio.sleep(0.03)
    except Exception as e:
        print("WebSocket test closed:", e)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(oak_loop())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)