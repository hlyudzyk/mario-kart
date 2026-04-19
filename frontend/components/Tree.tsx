import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

export type TreeData = {
  top: number;
  scale: number;
  offsetX: number;
};

type TreeProps = {
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
  source: ImageSourcePropType;
};

export const Tree = ({
  left,
  top,
  width,
  height,
  zIndex,
  source,
}: TreeProps) => {
  return (
    <Image
      source={source}
      style={[
        styles.tree,
        {
          left,
          top,
          width,
          height,
          zIndex,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  tree: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});
