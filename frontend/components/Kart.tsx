import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export type KartProps = {
  left: number;
  top: number;
  size: number;
  source: ImageSourcePropType;
  zIndex?: number;
  testID?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Kart = ({
  left,
  top,
  size,
  source,
  zIndex,
  testID,
  containerStyle,
}: KartProps) => {
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
        containerStyle,
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
