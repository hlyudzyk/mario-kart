import depthai as dai


def main():
    devices = dai.Device.getAllAvailableDevices()
    print(f"Found {len(devices)} device(s)")

    for d in devices:
        print(f"- {d.getDeviceId()} [{d.state.name}]")

    if not devices:
        raise RuntimeError("No OAK device found")

    with dai.Device() as device:
        print("Connected to OAK")
        print("Device info:", device.getDeviceId())


if __name__ == "__main__":
    main()