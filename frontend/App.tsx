import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Kart } from "./components/Kart";
import { TrackLines, roadLineWidth, centerDashHeight, centerDashGap } from "./components/TrackLines";
import { Tree, TreeData } from "./components/Tree";

type RemoteCar = {
  x: number;
  y: number;
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const socketRef = useRef<WebSocket | null>(null);
  const [cars, setCars] = useState<RemoteCar[]>([]);
  const [wobbleTick, setWobbleTick] = useState(0);

  const sideBorderWidth = width * 0.1;
  const centerLineOffset = (width - sideBorderWidth * 2 - roadLineWidth) / 2;
  const dashCount = Math.ceil(height / (centerDashHeight + centerDashGap));

  const trackWidth = width - sideBorderWidth * 2;
  const kartSize = 110;
  const kartYOffset = 60;
  const marioX = trackWidth * 0.75 - kartSize / 2;
  const marioY = height - kartSize - kartYOffset;
  const laneWidth = (trackWidth - roadLineWidth) / 2;
  const leftLaneCenter = sideBorderWidth + laneWidth / 2 - kartSize + 10;
  const rightLaneCenter =
    sideBorderWidth + laneWidth + roadLineWidth + laneWidth / 2 - kartSize + 10;
  const verticalTravel = height - kartSize - kartYOffset;
  const treeBaseWidth = sideBorderWidth + 40;
  const treeCount = Math.ceil(height / 150) + 3;
  const roadLeftBound = sideBorderWidth + 4;
  const roadRightBound = width - sideBorderWidth - kartSize - 4;
  const laneWobble = 7;

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      setWobbleTick((current) => current + 1);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  const wobbleX = (seed: number, intensity = laneWobble) =>
    Math.sin(wobbleTick * 0.08 + seed) * intensity +
    Math.sin(wobbleTick * 0.21 + seed * 1.7) * (intensity * 0.35);

  const clampLeft = (left: number) =>
    Math.max(roadLeftBound, Math.min(roadRightBound, left));

  const leftTrees = useMemo(
    () =>
      Array.from({ length: treeCount }).map((_, i) => ({
        top: i * 150 + (Math.random() * 200 - 100),
        scale: 0.8 + Math.random() * 0.5,
        offsetX: (Math.random() - 0.5) * (sideBorderWidth * 0.6),
      })),
    [treeCount, sideBorderWidth]
  );

  const rightTrees = useMemo(
    () =>
      Array.from({ length: treeCount }).map((_, i) => ({
        top: i * 150 + (Math.random() * 200 - 100),
        scale: 0.8 + Math.random() * 0.5,
        offsetX: (Math.random() - 0.5) * (sideBorderWidth * 0.6),
      })),
    [treeCount, sideBorderWidth]
  );

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/wsTest");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const nextCars = JSON.parse(event.data);
        if (!Array.isArray(nextCars)) {
          return;
        }

        setCars(
          nextCars
            .filter(
              (car): car is RemoteCar =>
                car &&
                typeof car.x === "number" &&
                typeof car.y === "number"
            )
            .map((car) => ({
              x: Math.max(0, Math.min(1, car.x)),
              y: Math.max(0, Math.min(1, car.y)),
            }))
        );
      } catch (error) {
        console.warn("Failed to parse websocket payload", error);
      }
    };

    ws.onerror = (error) => {
      console.warn("WebSocket error", error);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          borderLeftWidth: sideBorderWidth,
          borderRightWidth: sideBorderWidth,
        },
      ]}
    >
      <View style={styles.gameContainer}>
        {leftTrees.map((tree, index) => (
          <Tree
            key={`left-tree-${index}`}
            tree={tree}
            sideBorderWidth={sideBorderWidth}
            treeBaseWidth={treeBaseWidth}
            side="left"
            source={require("./assets/mario_kart_models_front/tree.png")}
          />
        ))}
        {rightTrees.map((tree, index) => (
          <Tree
            key={`right-tree-${index}`}
            tree={tree}
            sideBorderWidth={sideBorderWidth}
            treeBaseWidth={treeBaseWidth}
            side="right"
            source={require("./assets/mario_kart_models_front/tree.png")}
          />
        ))}
        <Kart
          left={clampLeft(marioX + wobbleX(0, 4))}
          top={marioY}
          size={kartSize}
          source={require("./assets/mario_kart_models_back/mario-back.png")}
        />
        {cars.map((car, index) => {
          const left =
            clampLeft(
              (car.x < 0.5 ? leftLaneCenter : rightLaneCenter) +
                wobbleX(index + car.y * 10)
            );
          const top = Math.max(0, verticalTravel * (1 - car.y));

          return (
            <Kart
              key={`${index}-${car.x}-${car.y}`}
              left={left}
              top={top}
              size={kartSize}
              source={require("./assets/mario_kart_models_back/luigi-back.png")}
            />
          );
        })}
      </View>
      <TrackLines centerLineOffset={centerLineOffset} dashCount={dashCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    borderColor: "green",
  },
  gameContainer: {
    flex: 1,
  },
});
