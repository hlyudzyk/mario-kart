import cv2
import depthai as dai
from depthai_nodes.node import ApplyColormap
from typing import Optional
from utils.arguments import initialize_argparser

_, args = initialize_argparser()

visualizer = dai.RemoteConnection(httpPort=8082)
device = dai.Device(dai.DeviceInfo(args.device)) if args.device else dai.Device()

NN_DIMENSIONS = (512, 288)

if not device.setIrLaserDotProjectorIntensity(1):
    print(
        "Failed to set IR laser projector intensity. Maybe your device does not support this feature."
    )

with dai.Pipeline(device) as pipeline:
    print("Creating pipeline...")
    platform = device.getPlatform()

    model_description = dai.NNModelDescription.fromYamlFile(
        f"yolov6_nano_r2_coco.{platform.name}.yaml"
    )

    nn_archive = dai.NNArchive(dai.getModelFromZoo(model_description))
    cameraNode = pipeline.create(dai.node.Camera).build(dai.CameraBoardSocket.CAM_A)

    detectionNetwork = pipeline.create(dai.node.DetectionNetwork)
    cameraNode.requestOutput(NN_DIMENSIONS, dai.ImgFrame.Type.BGR888p).link(
        detectionNetwork.input
    )
    detectionNetwork.setNNArchive(nn_archive, numShaves=4)

    outputToEncode = cameraNode.requestOutput((1440, 1080), type=dai.ImgFrame.Type.NV12)
    
    # Add the remote connector topics
    visualizer.addTopic("Raw video", outputToEncode)
    visualizer.addTopic("Detections", detectionNetwork.out)
    nnout = detectionNetwork.out.createOutputQueue()

    # Stereo depth - only for stereo devices
    cameraFeatures = device.getConnectedCameraFeatures()

    cam_mono_1: Optional[dai.CameraBoardSocket] = None
    cam_mono_2: Optional[dai.CameraBoardSocket] = None
    for feature in cameraFeatures:
        if dai.CameraSensorType.MONO in feature.supportedTypes:
            if cam_mono_1 is None:
                cam_mono_1 = feature.socket
            else:
                cam_mono_2 = feature.socket
                break
    if cam_mono_1 and cam_mono_2:
        device.setIrLaserDotProjectorIntensity(1)
        left_cam = pipeline.create(dai.node.Camera).build(cam_mono_1)
        right_cam = pipeline.create(dai.node.Camera).build(cam_mono_2)
        stereo = pipeline.create(dai.node.StereoDepth).build(
            left=left_cam.requestFullResolutionOutput(dai.ImgFrame.Type.NV12),
            right=right_cam.requestFullResolutionOutput(dai.ImgFrame.Type.NV12),
            presetMode=dai.node.StereoDepth.PresetMode.DEFAULT,
        )

        # RVC4 does not support stereo.setDepthAlign, ImageAlign node used instead
        if platform == dai.Platform.RVC4:
            cam_out = cameraNode.requestOutput(
                (640, 480), type=dai.ImgFrame.Type.NV12, enableUndistortion=True
            )
            align = pipeline.create(dai.node.ImageAlign)
            stereo.depth.link(align.input)
            cam_out.link(align.inputAlignTo)
            coloredDepth = pipeline.create(ApplyColormap).build(
                align.outputAligned
            )
        else:
            stereo.setDepthAlign(dai.CameraBoardSocket.CAM_A)
            stereo.setOutputSize(800, 600)
            coloredDepth = pipeline.create(ApplyColormap).build(stereo.disparity)
        coloredDepth.setColormap(cv2.COLORMAP_JET)
        visualizer.addTopic("Depth", coloredDepth.out)

    print("Pipeline created.")

    pipeline.start()
    visualizer.registerPipeline(pipeline)

    while pipeline.isRunning():
        nn_msg = nnout.get()
        print("-"*100)
        print(nn_msg)
        print("-"*100)
        key = visualizer.waitKey(1)
        if key == ord("q"):
            print("Got q key from the remote connection!")
            break