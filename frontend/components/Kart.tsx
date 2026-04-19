import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

export type KartProps = {
  left: number;
  top: number;
  size: number;
  source: ImageSourcePropType;
  zIndex?: number;
  testID?: string;
};

export const Kart = ({ left, top, size, source, zIndex, testID }: KartProps) => {
  return (
    <View
      testID={testID}
      style={[
        styles.kart,
        {
          left,
          top,
          width: size,
          height: size,
          zIndex,
        },
      ]}
    >
      <Image
        source={source}
        style={styles.image}
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
  image: {
    width: '100%',
    height: '100%',
  },
});
