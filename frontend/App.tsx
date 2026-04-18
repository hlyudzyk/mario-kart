import React from "react";
import { StyleSheet, View, useWindowDimensions, Image, Dimensions } from "react-native";
import { GameEngine } from "react-native-game-engine";

const MoveSystem = (entities, { time }) => {
  const window = Dimensions.get("window");
  const playAreaWidth = window.width - (window.width * 0.10 * 2);
  const playAreaHeight = window.height;

  const square = entities.square;
  if (!square) return entities;

  square.position.x += square.velocity.x * (time.delta / 1000);
  square.position.y += square.velocity.y * (time.delta / 1000);

  // Bounce off lateral edges based on calculated screen dimensions
  if (square.position.x <= 0) {
    square.position.x = 0;
    square.velocity.x *= -1;
  } else if (square.position.x + square.size >= playAreaWidth) {
    square.position.x = playAreaWidth - square.size;
    square.velocity.x *= -1;
  }

  // Bounce off top/bottom edges
  if (square.position.y <= 0) {
    square.position.y = 0;
    square.velocity.y *= -1;
  } else if (square.position.y + square.size >= playAreaHeight) {
    square.position.y = playAreaHeight - square.size;
    square.velocity.y *= -1;
  }

  return entities;
};

const Square = ({ position, size }) => {
  return (
    <View
      style={[
        styles.square,
        {
          left: position.x,
          top: position.y,
          width: size,
          height: size,
        },
      ]}
    >
      <Image 
        source={require('./assets/mario_kart_models_back/mario-back.png')} 
        style={{ width: '100%', height: '100%' }} 
        resizeMode="contain" 
      />
    </View>
  );
};

const roadLineWidth = 8;
const centerDashHeight = 24;
const centerDashGap = 36;
export default function App() {
  const { width, height } = useWindowDimensions();
  const sideBorderWidth = width * 0.10;
  const centerLineOffset = (width - sideBorderWidth * 2 - roadLineWidth) / 2;
  const dashCount = Math.ceil(height / (centerDashHeight + centerDashGap));

  const trackWidth = width - sideBorderWidth * 2;
  const kartSize = 110;
  const kartX = (trackWidth * 0.75) - (kartSize / 2); 
  const kartY = height - kartSize - 60;

  const entities = {
    square: {
      position: { x: kartX, y: kartY },
      size: kartSize,
      renderer: Square,
    },
  };

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
      <GameEngine 
        key={`game-engine-${width}-${height}`}
        style={styles.gameContainer}
        systems={[]}
        entities={entities}
      />
      <View pointerEvents="none" style={[styles.divider, styles.leftDivider]} />
      <View pointerEvents="none" style={[styles.divider, styles.rightDivider]} />
      <View pointerEvents="none" style={[styles.centerLine, { left: centerLineOffset }]}>
        {Array.from({ length: dashCount }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.centerLineDash,
              index < dashCount - 1 && styles.centerLineDashSpacing,
            ]}
          />
        ))}
      </View>
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
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: roadLineWidth,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  leftDivider: {
    left: 0,
  },
  rightDivider: {
    right: 0,
  },
  centerLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: roadLineWidth,
    alignItems: "stretch",
    zIndex: 1,
  },
  centerLineDash: {
    width: roadLineWidth,
    height: centerDashHeight,
    backgroundColor: "#fff",
  },
  centerLineDashSpacing: {
    marginBottom: centerDashGap,
  },
  square: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});
