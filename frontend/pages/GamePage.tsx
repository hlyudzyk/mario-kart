import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Kart } from "../components/Kart";
import { TrackLines, roadLineWidth, centerDashHeight, centerDashGap } from "../components/TrackLines";
import { Tree } from "../components/Tree";
import { Scoreboard } from "../components/Scoreboard";

type RemoteCar = {
  x: number;
  y: number;
};

type Coin = {
  id: number;
  x: number;
  y: number;
};

export const GamePage = () => {
    const { width, height } = useWindowDimensions();
      const socketRef = useRef<WebSocket | null>(null);
      const roadScrollRef = useRef(0);
      const lastFrameTimeRef = useRef<number | null>(null);
      const [cars, setCars] = useState<RemoteCar[]>([]);
      const [coins, setCoins] = useState<Coin[]>([]);
      const [score, setScore] = useState(0);
      const coinIdCounter = useRef(0);
      const [wobbleTick, setWobbleTick] = useState(0);
      const [roadScroll, setRoadScroll] = useState(0);
    
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
        let lastCoinSpawn = 0;
    
        const animate = (time: number) => {
          const previousTime = lastFrameTimeRef.current ?? time;
          const delta = time - previousTime;
          lastFrameTimeRef.current = time;
    
          setWobbleTick((current) => current + 1);
          roadScrollRef.current += delta * 0.18;
          setRoadScroll(roadScrollRef.current);
    
          if (time - lastCoinSpawn > 1500) {
            lastCoinSpawn = time;
            const spawnX = Math.random() > 0.5 ? 0.2 : 0.8;
            setCoins((prev) => [
              ...prev,
              {
                id: coinIdCounter.current++,
                x: spawnX,
                y: 1.0,
              },
            ]);
          }
    
          setCoins((prevCoins) => {
            let scAdded = 0;
            const nextCoins: Coin[] = [];
    
            for (const coin of prevCoins) {
              const nextY = coin.y - 0.01;
              if (nextY < -0.1) continue;
    
              // Simple collision: mario is near y=0, x=0.75
              if (nextY > -0.05 && nextY < 0.15) {
                const marioNormX = 0.75;
                if (Math.abs(coin.x - marioNormX) < 0.4) { // Increased hit box
                  scAdded++;
                  continue; // consume coin
                }
              }
              nextCoins.push({ ...coin, y: nextY });
            }
    
            if (scAdded > 0) {
              setScore((s) => s + scAdded);
            }
    
            return nextCoins;
          });
    
          frame = requestAnimationFrame(animate);
        };
    
        frame = requestAnimationFrame(animate);
    
        return () => {
          cancelAnimationFrame(frame);
          lastFrameTimeRef.current = null;
        };
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
            <Scoreboard score={score} />
            {leftTrees.map((tree, index) => (
                <Tree
                key={`left-tree-${index}`}
                tree={tree}
                sideBorderWidth={sideBorderWidth}
                treeBaseWidth={treeBaseWidth}
                scrollOffset={roadScroll}
                viewportHeight={height}
                side="left"
                source={require("../assets/tree.png")}
                />
            ))}
            {rightTrees.map((tree, index) => (
                <Tree
                key={`right-tree-${index}`}
                tree={tree}
                sideBorderWidth={sideBorderWidth}
                treeBaseWidth={treeBaseWidth}
                scrollOffset={roadScroll}
                viewportHeight={height}
                side="right"
                source={require("../assets/tree.png")}
                />
            ))}
            <Kart
                left={clampLeft(marioX + wobbleX(0, 4))}
                top={marioY}
                size={kartSize}
                source={require("../assets/mario_kart_models_back/mario-back.png")}
            />
            {coins.map((coin) => {
                const left =
                clampLeft(
                    (coin.x < 0.5 ? leftLaneCenter : rightLaneCenter) +
                    wobbleX(coin.id * 10 + coin.y * 10)
                ) + kartSize / 4;
                const top = Math.max(0, verticalTravel * (1 - coin.y));
    
                return (
                <Image
                    key={`coin-${coin.id}`}
                    source={require("../assets/coin.png")}
                    style={{
                    position: "absolute",
                    left,
                    top,
                    width: 50,
                    height: 50,
                    zIndex: 20
                    }}
                    resizeMode="contain"
                />
                );
            })}
            {cars.map((car, index) => {
                const left =
                clampLeft(
                    (car.x < 0.5 ? leftLaneCenter : rightLaneCenter) +
                    wobbleX(index + car.y * 10)
                );
                const top = Math.max(0, verticalTravel * (1 - car.y));
                const source =
                car.x < 0.5
                    ? require("../assets/mario_kart_models_front/luigi-front.png")
                    : require("../assets/mario_kart_models_back/luigi-back.png");
    
                return (
                <Kart
                    key={`${index}-${car.x}-${car.y}`}
                    left={left}
                    top={top}
                    size={kartSize}
                    source={source}
                />
                );
            })}
            </View>
            <TrackLines
            centerLineOffset={centerLineOffset}
            dashCount={dashCount}
            scrollOffset={roadScroll}
            />
        </View>
    )
};

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