import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ScoreboardProps = {
  score: number;
};

export const Scoreboard = ({ score }: ScoreboardProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>COINS: {score}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 74,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  text: {
    color: "#fff", // White text
    fontSize: 36,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    // Add a simple gold border around the text for that "Mario" feel
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
});
