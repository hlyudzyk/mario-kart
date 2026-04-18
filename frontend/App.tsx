// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// import { NewAppScreen } from '@react-native/new-app-screen';
// import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
// import {
//   SafeAreaProvider,
//   useSafeAreaInsets,
// } from 'react-native-safe-area-context';

// function App() {
//   const isDarkMode = useColorScheme() === 'dark';

//   return (
//     <SafeAreaProvider>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// function AppContent() {
//   const safeAreaInsets = useSafeAreaInsets();

//   return (
//     <View style={styles.container}>
//       <NewAppScreen
//         templateFileName="App.tsx"
//         safeAreaInsets={safeAreaInsets}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });

// export default App;


import React from "react";
import { StyleSheet, View } from "react-native";
import { GameEngine } from "react-native-game-engine";

const MoveSystem = (entities, { time }) => {
  const square = entities.square;
  if (!square) return entities;

  square.position.x += square.velocity.x * (time.delta / 1000);
  square.position.y += square.velocity.y * (time.delta / 1000);

  if (square.position.x <= 0 || square.position.x + square.size >= 360) {
    square.velocity.x *= -1;
  }

  if (square.position.y <= 0 || square.position.y + square.size >= 640) {
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
    />
  );
};

export default function App() {
  const entities = {
    square: {
      position: { x: 100, y: 100 },
      velocity: { x: 120, y: 90 },
      size: 50,
      renderer: Square,
    },
  };

  return (
    <View style={styles.container}>
      <GameEngine style={styles.gameContainer} systems={[MoveSystem]} entities={entities} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  gameContainer: {
    flex: 1,
  },
  square: {
    position: "absolute",
    backgroundColor: "tomato",
  },
});