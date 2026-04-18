import React from "react";
import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";

export type KartProps = {
  left: number;
  top: number;
  size: number;
  source: ImageSourcePropType;
};

export const Kart = ({ left, top, size, source }: KartProps) => {
  return (
    <View
      style={[
        styles.kart,
        {
          left,
          top,
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={source}
        style={{ width: "100%", height: "100%" }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  kart: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});
