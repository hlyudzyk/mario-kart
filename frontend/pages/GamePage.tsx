import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Kart } from '../components/Kart';
import { RoadsideTreesLayer } from '../components/RoadsideTreesLayer';
import { TrackLines } from '../components/TrackLines';
import { Scoreboard } from '../components/Scoreboard';
import {
  getDepthScale,
  getRoadBoundsAtScreenY,
  getScreenYForWorldY,
  projectRoadX,
} from '../utils/gameProjection';

type RemoteCar = {
  x: number;
  y: number;
  label: string;
  id: string;
};

type Coin = {
  id: number;
  x: number;
  y: number;
};

const CAR_SKINS = [
  {
    front: require('../assets/mario_kart_models_front/bowser-front.png'),
    back: require('../assets/mario_kart_models_back/bowser-back.png'),
  },
  {
    front: require('../assets/mario_kart_models_front/peach-front.png'),
    back: require('../assets/mario_kart_models_back/peach-back.png'),
  },
  {
    front: require('../assets/mario_kart_models_front/luigi-front.png'),
    back: require('../assets/mario_kart_models_back/luigi-back.png'),
  },
] as const;

const ROAD_BOTTOM_WIDTH_RATIO = 0.9;
const ROAD_TOP_WIDTH_RATIO = 0.34;
const LEFT_LANE_X = 0.28;
const RIGHT_LANE_X = 0.72;
const MARIO_ROAD_X = RIGHT_LANE_X;
const KART_SIZE = 126;
const COIN_SIZE = 52;
const KART_Y_OFFSET = 48;
const TREE_ASSET = require('../assets/tree.png');
const COIN_ASSET = require('../assets/coin.png');
const MARIO_ASSET = require('../assets/mario_kart_models_back/mario-back.png');
const COIN_SPEED_PER_MS = 0.0006;
const COIN_SPAWN_INTERVAL_MS = 4000;
const COIN_COMMIT_INTERVAL_MS = 33;
const WORLD_TOP_INSET = 132;

const hashId = (id: string) => {
  let hash = 0;

  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 2147483647;
  }

  return hash;
};

const getStaticLateralOffset = (seed: number, amplitude: number) => {
  return (
    Math.sin(seed * 4.37) * amplitude * 0.6 +
    Math.sin(seed * 1.91 + 1.4) * amplitude * 0.3
  );
};

type GamePageProps = {
  navigation?: {
    goBack?: () => void;
    navigate?: (screen: string) => void;
  };
};

export const GamePage = ({ navigation }: GamePageProps) => {
  const { width, height } = useWindowDimensions();
  const socketRef = useRef<WebSocket | null>(null);
  const lastCoinFrameTimeRef = useRef<number | null>(null);
  const visibleCoinsRef = useRef<Coin[]>([]);
  const [cars, setCars] = useState<RemoteCar[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const coinIdCounter = useRef(0);

  const bottomRoadWidth = width * ROAD_BOTTOM_WIDTH_RATIO;
  const topRoadWidth = width * ROAD_TOP_WIDTH_RATIO;
  const perspectiveRoad = useMemo(
    () => ({
      viewportWidth: width,
      viewportHeight: height,
      topRoadWidth,
      bottomRoadWidth,
    }),
    [bottomRoadWidth, height, topRoadWidth, width],
  );
  const marioTop = height - KART_SIZE - KART_Y_OFFSET;
  const verticalTravel = marioTop;
  const worldTravelHeight = Math.max(0, verticalTravel - WORLD_TOP_INSET);
  const grassWidth = (width - bottomRoadWidth) / 2;
  const treeBaseWidth = Math.max(86, grassWidth * 1.25 + 42);
  const treeCount = Math.ceil(height / 150) + 3;

  const clampSpriteLeft = (left: number, anchorY: number, size: number) => {
    const bounds = getRoadBoundsAtScreenY(anchorY, perspectiveRoad);

    return Math.max(bounds.left + 8, Math.min(bounds.right - size - 8, left));
  };

  const getProjectedSprite = (
    roadX: number,
    worldY: number,
    baseSize: number,
    minScale: number,
    offsetSeed?: number,
  ) => {
    const top = WORLD_TOP_INSET + getScreenYForWorldY(worldY, worldTravelHeight);
    const scale = getDepthScale(worldY, minScale, 1);
    const size = baseSize * scale;
    const anchorY = top + size * 0.8;
    const centerX = projectRoadX(roadX, anchorY, perspectiveRoad);
    const lateralOffset =
      offsetSeed === undefined ? 0 : getStaticLateralOffset(offsetSeed, 9) * scale;

    return {
      top,
      size,
      left: centerX - size / 2 + lateralOffset,
      zIndex: 20 + Math.round(scale * 30),
    };
  };

  useEffect(() => {
    let frame = 0;
    let lastCoinSpawn: number | null = null;
    let lastCommit: number | null = null;

    const animate = (time: number) => {
      const previousTime = lastCoinFrameTimeRef.current ?? time;
      const delta = time - previousTime;
      lastCoinFrameTimeRef.current = time;

      if (lastCoinSpawn === null) {
        lastCoinSpawn = time;
      }

      const previousCoins = visibleCoinsRef.current;
      let nextCoins = previousCoins;

      if (time - lastCoinSpawn >= COIN_SPAWN_INTERVAL_MS) {
        lastCoinSpawn = time;
        const spawnX = Math.random() > 0.5 ? LEFT_LANE_X : RIGHT_LANE_X;
        nextCoins = [
          ...nextCoins,
          {
            id: coinIdCounter.current++,
            x: spawnX,
            y: 1,
          },
        ];
      }

      let scoreAdded = 0;
      const deltaY = delta * COIN_SPEED_PER_MS;
      const movedCoins: Coin[] = [];

      for (const coin of nextCoins) {
        const nextY = coin.y - deltaY;
        if (nextY < -0.12) {
          continue;
        }

        // Mario is always at MARIO_ROAD_X (RIGHT_LANE_X) and y ~ 0.
        // We consume coins that hit mario: y < 0.08 touches the kart border!
        if (nextY > -0.12 && nextY < 0.08 && Math.abs(coin.x - MARIO_ROAD_X) < 0.2) {
          scoreAdded += 1;
          continue;
        }

        movedCoins.push({ ...coin, y: nextY });
      }

      visibleCoinsRef.current = movedCoins;

      if (scoreAdded > 0) {
        setScore(currentScore => currentScore + scoreAdded);
      }

      if (
        (lastCommit === null || time - lastCommit >= COIN_COMMIT_INTERVAL_MS) &&
        (movedCoins.length > 0 || previousCoins.length > 0)
      ) {
        lastCommit = time;
        setCoins(movedCoins);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      lastCoinFrameTimeRef.current = null;
    };
  }, []);

  const marioAnchorY = marioTop + KART_SIZE * 0.82;
  const marioCenterX = projectRoadX(MARIO_ROAD_X, marioAnchorY, perspectiveRoad);
  const marioLeft = clampSpriteLeft(marioCenterX - KART_SIZE / 2, marioAnchorY, KART_SIZE);

  useEffect(() => {
    const isTest = false;
    const ws = new WebSocket(`ws://localhost:8000/${isTest ? 'wsText' : 'ws'}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = event => {
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
                typeof car.x === 'number' &&
                typeof car.y === 'number' &&
                typeof car.label === 'string' &&
                (typeof car.id === 'string' || typeof car.id === 'number'),
            )
            .map(car => ({
              x: Math.max(0, Math.min(1, car.x)),
              y: Math.max(0, Math.min(1, car.y)),
              label: car.label,
              id: String(car.id),
            })),
        );
      } catch (error) {
        console.warn('Failed to parse websocket payload', error);
      }
    };

    ws.onerror = error => {
      console.warn('WebSocket error', error);
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.gameContainer}>
        <Pressable
          accessibilityRole="button"
          testID="back-button"
          onPress={() => {
            if (navigation?.goBack) {
              navigation.goBack();
              return;
            }

            navigation?.navigate?.('Home');
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </Pressable>
        <TrackLines
          viewportWidth={width}
          viewportHeight={height}
          topRoadWidth={topRoadWidth}
          bottomRoadWidth={bottomRoadWidth}
        />
        <RoadsideTreesLayer
          viewportWidth={width}
          viewportHeight={height}
          topRoadWidth={topRoadWidth}
          bottomRoadWidth={bottomRoadWidth}
          treeBaseWidth={treeBaseWidth}
          treeCount={treeCount}
          source={TREE_ASSET}
        />
        <Scoreboard score={score} />
        <Kart
          left={marioLeft}
          top={marioTop}
          size={KART_SIZE}
          source={MARIO_ASSET}
          zIndex={90}
          testID="local-kart"
        />
        {coins.map(coin => {
          const placement = getProjectedSprite(
            coin.x,
            coin.y,
            COIN_SIZE,
            0.42,
            coin.id * 0.73,
          );

          return (
            <Image
              key={`coin-${coin.id}`}
              testID={`coin-${coin.id}`}
              source={COIN_ASSET}
              style={[
                styles.sprite,
                {
                  left: placement.left,
                  top: placement.top,
                  width: placement.size,
                  height: placement.size,
                  zIndex: placement.zIndex,
                },
              ]}
              resizeMode="contain"
            />
          );
        })}
        {cars.map((car, index) => {
          const roadX = Math.max(0.08, Math.min(0.92, car.x));

          if (car.label === 'person') {
            // Hide camera "coins" if they hit the boundary of the character
            if (car.y < 0.08 && car.y > -0.12 && Math.abs(roadX - MARIO_ROAD_X) < 0.2) {
              return null;
            }

            const placement = getProjectedSprite(
              roadX,
              car.y,
              COIN_SIZE,
              0.42,
              index + hashId(car.id) * 0.01,
            );

            return (
              <Image
                key={`${index}-${car.id}-${car.x}-${car.y}`}
                testID={`person-${car.id}`}
                source={COIN_ASSET}
                style={[
                  styles.sprite,
                  {
                    left: placement.left,
                    top: placement.top,
                    width: placement.size,
                    height: placement.size,
                    zIndex: placement.zIndex,
                  },
                ]}
                resizeMode="contain"
              />
            );
          }

          const placement = getProjectedSprite(
            roadX,
            car.y,
            KART_SIZE,
            0.46,
            index + hashId(car.id) * 0.01,
          );
          const skinIndex = hashId(car.id) % CAR_SKINS.length;
          const source =
            roadX < 0.5 ? CAR_SKINS[skinIndex].front : CAR_SKINS[skinIndex].back;

          return (
            <Kart
              key={`${car.id}-${car.x}-${car.y}`}
              left={placement.left}
              top={placement.top}
              size={placement.size}
              source={source}
              zIndex={placement.zIndex}
              testID={`remote-kart-${car.id}`}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f8f42',
  },
  gameContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 22,
    left: 18,
    zIndex: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ translateY: 2 }],
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  sprite: {
    position: 'absolute',
  },
});
