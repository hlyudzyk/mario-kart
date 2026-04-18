/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

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

  // Tree styling / count
  const treeBaseWidth = sideBorderWidth + 40; // At least 10px bigger than the border itself
  const treeCount = Math.ceil(height / 150) + 3; // Added extra trees to fill larger random gaps

  // Generate localized random tree properties locking them into place
  const leftTrees = React.useMemo(() => {
    return Array.from({ length: treeCount }).map((_, i) => ({
      top: i * 150 + (Math.random() * 200 - 100),     // Huge vertical randomness
      scale: 0.8 + Math.random() * 0.5,               // Random size between 80% and 130%
      offsetX: (Math.random() - 0.5) * (sideBorderWidth * 0.6), // Much more horizontal scatter
    }));
  }, [treeCount, sideBorderWidth]);

  const rightTrees = React.useMemo(() => {
    return Array.from({ length: treeCount }).map((_, i) => ({
      top: i * 150 + (Math.random() * 200 - 100),
      scale: 0.8 + Math.random() * 0.5,
      offsetX: (Math.random() - 0.5) * (sideBorderWidth * 0.6),
    }));
  }, [treeCount, sideBorderWidth]);

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
          overflow: 'visible', // Ensure trees over border aren't clipped
        },
      ]}
    >
      <GameEngine 
        key={`game-engine-${width}-${height}`}
        style={styles.gameContainer}
        systems={[]}
        entities={entities}
      />
      {/* Left border trees */}
      {leftTrees.map((tree, index) => {
        const tWidth = treeBaseWidth * tree.scale;
        return (
          <Image
            key={`left-tree-${index}`}
            source={require('./assets/mario_kart_models_front/tree.png')}
            style={{
              position: 'absolute',
              left: -sideBorderWidth + (sideBorderWidth - tWidth) / 2 + tree.offsetX,
              top: tree.top,
              width: tWidth,
              height: tWidth * 1.55,
              resizeMode: 'contain',
              zIndex: 10,
            }}
          />
        );
      })}
      {/* Right border trees */}
      {rightTrees.map((tree, index) => {
        const tWidth = treeBaseWidth * tree.scale;
        return (
          <Image
            key={`right-tree-${index}`}
            source={require('./assets/mario_kart_models_front/tree.png')}
            style={{
              position: 'absolute',
              right: -sideBorderWidth + (sideBorderWidth - tWidth) / 2 + tree.offsetX,
              top: tree.top,
              width: tWidth,
              height: tWidth * 1.55,
              resizeMode: 'contain',
              zIndex: 10,
            }}
          />
        );
      })}
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
      {/* Speed Indicator */}
      <View style={[styles.speedIndicator, { left: -sideBorderWidth + 10 }]}>
        <Text style={styles.speedText}>50 km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
