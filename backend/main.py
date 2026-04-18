import asyncio
import json
import math
import depthai as dai
from fastapi import FastAPI, WebSocket
import uvicorn
from faker import build_payload, init_cars, update_cars

app = FastAPI()

latest_detections = []


def compute_position(det: dict) -> dict:
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
    # Y raw (distance proxy)
    # -------------------------
    y_raw = 1 / math.sqrt(area)

    # -------------------------
    # Normalize Y → [0, 1]
    # -------------------------
    Y_MIN = 1.0  # tune this
    Y_MAX = 8.0  # tune this

    y = (y_raw - Y_MIN) / (Y_MAX - Y_MIN)
    y = max(0.0, min(1.0, y))

    return {
        "x": round(x, 3),
        "y": round(y, 3)
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

         # --- ADD: ObjectTracker node ---
        objectTracker = pipeline.create(dai.node.ObjectTracker)
        objectTracker.setDetectionLabelsToTrack([0, 2])  # 0=person, 2=car in COCO
        objectTracker.setTrackerType(dai.TrackerType.ZERO_TERM_COLOR_HISTOGRAM)
        objectTracker.setTrackerIdAssignmentPolicy(dai.TrackerIdAssignmentPolicy.UNIQUE_ID)


        # Wire NN → tracker (two links required)
        detectionNetwork.passthrough.link(objectTracker.inputTrackerFrame)
        detectionNetwork.passthrough.link(objectTracker.inputDetectionFrame)
        detectionNetwork.out.link(objectTracker.inputDetections)
        
        trackerOut = objectTracker.out.createOutputQueue()
        pipeline.start()
        
        while pipeline.isRunning():
            tracklets_msg = trackerOut.get()
            points = []
            for t in tracklets_msg.tracklets:
                # Skip lost objects — they're gone from the scene
                if t.status == dai.Tracklet.TrackingStatus.LOST:
                    continue

                label_name = t.label  # int label index from COCO
                # Map label index back to name (0=person, 2=car in COCO)
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
                if pos:
                    pos["label"] = label_str
                    pos["id"] = t.id  # <-- the persistent tracker ID
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