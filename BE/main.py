import cv2
import depthai as dai


def main():
    pipeline = dai.Pipeline()
    cam = pipeline.create(dai.node.Camera).build(dai.CameraBoardSocket.CAM_A)
    out = cam.requestOutput((1280, 720), dai.ImgFrame.Type.BGR888p)

    q = out.createOutputQueue()

    pipeline.start()
    print("Pipeline started")

    while pipeline.isRunning():
        frame = q.get().getCvFrame()
        cv2.imshow("OAK Camera", frame)
        if cv2.waitKey(1) == ord("q"):
            break

    pipeline.stop()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
