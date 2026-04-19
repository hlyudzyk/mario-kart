import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Sound from 'react-native-sound';
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

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
};

type MarioPose = {
  translateX: number;
  translateY: number;
  rotateDeg: number;
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
const MARIO_THEME_ASSET = require('../assets/sounds/mariokart-theme.mp3');
const COIN_SOUND_ASSET = require('../assets/sounds/coin.mp3');
const COIN_COMMIT_INTERVAL_MS = 33;
const WORLD_TOP_INSET = 132;
const PARTICLE_MIN_COUNT = 4;
const PARTICLE_MAX_COUNT = 6;
const PARTICLE_SPAWN_INTERVAL_MS = 55;
const PARTICLE_MIN_SIZE = 7;
const PARTICLE_MAX_SIZE = 14;
const PARTICLE_GROWTH_PER_MS = 0.014;
const PARTICLE_FADE_PER_MS = 0.0024;
const PARTICLE_BASE_COLOR = '#fff3a3';
const PARTICLE_ACCENT_COLOR = '#ff9f43';
const MARIO_TWEAK_X_AMPLITUDE = 1.8;
const MARIO_TWEAK_X_JITTER = 0.8;
const MARIO_TWEAK_Y_AMPLITUDE = 0.45;
const MARIO_TWEAK_ROTATION_DEG = 0.75;
const MARIO_TWEAK_SWAY_MS = 92;
const MARIO_TWEAK_JITTER_MS = 41;
const MARIO_TWEAK_BOB_MS = 150;
const MARIO_TWEAK_ROTATE_MS = 84;

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
  const themeSoundRef = useRef<Sound | null>(null);
  const coinSoundRef = useRef<Sound | null>(null);
  const lastCoinFrameTimeRef = useRef<number | null>(null);
  const visibleParticlesRef = useRef<Particle[]>([]);
  const collectedRef = useRef<Set<string>>(new Set());
  const [cars, setCars] = useState<RemoteCar[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [marioPose, setMarioPose] = useState<MarioPose>({
    translateX: 0,
    translateY: 0,
    rotateDeg: 0,
  });
  const [score, setScore] = useState(0);
  const particleIdCounter = useRef(0);

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

  const marioAnchorY = marioTop + KART_SIZE * 0.82;
  const marioCenterX = projectRoadX(MARIO_ROAD_X, marioAnchorY, perspectiveRoad);
  const marioLeft = clampSpriteLeft(marioCenterX - KART_SIZE / 2, marioAnchorY, KART_SIZE);

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

  const getMarioPose = (time: number): MarioPose => {
    const sway = Math.sin(time / MARIO_TWEAK_SWAY_MS) * MARIO_TWEAK_X_AMPLITUDE;
    const jitter = Math.sin(time / MARIO_TWEAK_JITTER_MS) * MARIO_TWEAK_X_JITTER;
    const combinedX = sway + jitter;

    return {
      translateX: combinedX,
      translateY: Math.abs(Math.cos(time / MARIO_TWEAK_BOB_MS)) * MARIO_TWEAK_Y_AMPLITUDE,
      rotateDeg:
        Math.sin(time / MARIO_TWEAK_ROTATE_MS) * MARIO_TWEAK_ROTATION_DEG +
        (combinedX / (MARIO_TWEAK_X_AMPLITUDE + MARIO_TWEAK_X_JITTER)) * 0.2,
    };
  };

  useEffect(() => {
    Sound.setCategory('Playback');
    const marioThemeUri = Image.resolveAssetSource(MARIO_THEME_ASSET)?.uri;

    if (!marioThemeUri) {
      console.warn('Failed to resolve mario theme asset');
      return;
    }

    let isMounted = true;
    const themeSound = new Sound(marioThemeUri, error => {
      if (error) {
        console.warn('Failed to load mario theme', error);
        return;
      }

      setTimeout(() => {
        if (!isMounted) {
          themeSound.release();
          return;
        }

        themeSound.setNumberOfLoops(-1);
        themeSound.play(success => {
          if (!success) {
            console.warn('Mario theme playback ended unexpectedly');
          }
        });
      }, 0);
    });

    themeSoundRef.current = themeSound;

    return () => {
      isMounted = false;
      const currentThemeSound = themeSoundRef.current;
      themeSoundRef.current = null;
      currentThemeSound?.stop();
      currentThemeSound?.release();
    };
  }, []);

  useEffect(() => {
    const coinSoundUri = Image.resolveAssetSource(COIN_SOUND_ASSET)?.uri;

    if (!coinSoundUri) {
      console.warn('Failed to resolve coin sound asset');
      return;
    }

    let isMounted = true;
    const coinSound = new Sound(coinSoundUri, error => {
      if (error) {
        console.warn('Failed to load coin sound', error);
        return;
      }

      if (!isMounted) {
        coinSound.release();
      }
    });

    coinSoundRef.current = coinSound;

    return () => {
      isMounted = false;
      const currentCoinSound = coinSoundRef.current;
      coinSoundRef.current = null;
      currentCoinSound?.stop();
      currentCoinSound?.release();
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let lastParticleSpawn: number | null = null;
    let lastCommit: number | null = null;

    const animate = (time: number) => {
      const previousTime = lastCoinFrameTimeRef.current ?? time;
      const delta = time - previousTime;
      lastCoinFrameTimeRef.current = time;

      let previousParticles = visibleParticlesRef.current;

      if (lastParticleSpawn === null) {
        lastParticleSpawn = time;
      }

      if (
        previousParticles.length < PARTICLE_MIN_COUNT ||
        (previousParticles.length < PARTICLE_MAX_COUNT &&
          time - lastParticleSpawn >= PARTICLE_SPAWN_INTERVAL_MS)
      ) {
        lastParticleSpawn = time;
        const nextMarioPose = getMarioPose(time);
        const rearCenterX = marioLeft + nextMarioPose.translateX + KART_SIZE * 0.5;
        const rearTop = marioTop + nextMarioPose.translateY + KART_SIZE * 0.72;
        const size =
          PARTICLE_MIN_SIZE +
          Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE);

        previousParticles = [
          ...previousParticles,
          {
            id: particleIdCounter.current++,
            left: rearCenterX + (Math.random() - 0.5) * 26 - size / 2,
            top: rearTop + (Math.random() - 0.5) * 16,
            size,
            opacity: 0.72 + Math.random() * 0.22,
            velocityX: (Math.random() - 0.5) * 0.11,
            velocityY: 0.06 + Math.random() * 0.08,
          },
        ];
      }

      const nextMarioPose = getMarioPose(time);
      const movedParticles: Particle[] = [];

      for (const particle of previousParticles) {
        const nextOpacity = particle.opacity - delta * PARTICLE_FADE_PER_MS;

        if (nextOpacity <= 0.03) {
          continue;
        }

        const nextSize = particle.size + delta * PARTICLE_GROWTH_PER_MS;
        const nextLeft = particle.left + particle.velocityX * delta;
        const nextTop = particle.top + particle.velocityY * delta;

        if (nextTop > height + 24) {
          continue;
        }

        movedParticles.push({
          ...particle,
          left: nextLeft,
          top: nextTop,
          size: nextSize,
          opacity: nextOpacity,
        });
      }

      visibleParticlesRef.current = movedParticles;

      if (
        (lastCommit === null || time - lastCommit >= COIN_COMMIT_INTERVAL_MS) &&
        (movedParticles.length > 0 ||
          previousParticles.length > 0)
      ) {
        lastCommit = time;
        setParticles(movedParticles);
        setMarioPose(nextMarioPose);
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      lastCoinFrameTimeRef.current = null;
      visibleParticlesRef.current = [];
    };
  }, [height, marioLeft, marioTop]);

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

        const parsed: RemoteCar[] = nextCars
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
          }));

        // Clean up collected IDs for objects no longer tracked
        const activeIds = new Set(parsed.map(c => c.id));
        for (const id of collectedRef.current) {
          if (!activeIds.has(id)) {
            collectedRef.current.delete(id);
          }
        }

        // Count coins entering Mario's collection zone for the first time
        let newCollections = 0;
        for (const car of parsed) {
          if (car.label === 'person') {
            const roadX = Math.max(0.08, Math.min(0.92, car.x));
            if (
              car.y < 0.08 &&
              car.y > -0.12 &&
              Math.abs(roadX - MARIO_ROAD_X) < 0.2 &&
              !collectedRef.current.has(car.id)
            ) {
              collectedRef.current.add(car.id);
              newCollections++;
            }
          }
        }

        if (newCollections > 0) {
          setScore(prev => prev + newCollections);
          const currentCoinSound = coinSoundRef.current;
          currentCoinSound?.stop(() => {
            currentCoinSound.setCurrentTime(0);
            currentCoinSound.play(success => {
              if (!success) {
                console.warn('Coin sound playback ended unexpectedly');
              }
            });
          });
        }

        setCars(parsed);
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
        {particles.map(particle => (
          <View
            key={`particle-${particle.id}`}
            pointerEvents="none"
            style={[
              styles.particle,
              {
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                zIndex: 84,
                backgroundColor:
                  particle.id % 2 === 0 ? PARTICLE_BASE_COLOR : PARTICLE_ACCENT_COLOR,
              },
            ]}
          />
        ))}
        <Kart
          left={marioLeft}
          top={marioTop}
          size={KART_SIZE}
          source={MARIO_ASSET}
          zIndex={90}
          testID="local-kart"
          containerStyle={{
            transform: [
              { translateX: marioPose.translateX },
              { translateY: marioPose.translateY },
              { rotate: `${marioPose.rotateDeg}deg` },
            ],
          }}
        />
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
  particle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#ffd166',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
});
