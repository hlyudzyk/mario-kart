import React from "react";
import { Image, ImageSourcePropType } from "react-native";

export type TreeData = {
  top: number;
  scale: number;
  offsetX: number;
};

type TreeProps = {
  tree: TreeData;
  sideBorderWidth: number;
  treeBaseWidth: number;
  side: "left" | "right";
  source: ImageSourcePropType;
};

export const Tree = ({ tree, sideBorderWidth, treeBaseWidth, side, source }: TreeProps) => {
  const tWidth = treeBaseWidth * tree.scale;
  
  const positionStyle = side === "left" ? {
    left: -sideBorderWidth + (sideBorderWidth - tWidth) / 2 + tree.offsetX,
  } : {
    right: -sideBorderWidth + (sideBorderWidth - tWidth) / 2 + tree.offsetX,
  };

  return (
    <Image
      source={source}
      style={{
        position: "absolute",
        ...positionStyle,
        top: tree.top,
        width: tWidth,
        height: tWidth * 1.55,
        resizeMode: "contain",
        zIndex: 10,
      }}
    />
  );
};
