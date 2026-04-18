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
  scrollOffset: number;
  viewportHeight: number;
  side: "left" | "right";
  source: ImageSourcePropType;
};

export const Tree = ({
  tree,
  sideBorderWidth,
  treeBaseWidth,
  scrollOffset,
  viewportHeight,
  side,
  source,
}: TreeProps) => {
  const tWidth = treeBaseWidth * tree.scale;
  const treeHeight = tWidth * 1.55;
  const travelHeight = viewportHeight + treeHeight + 160;
  const top = ((tree.top + scrollOffset) % travelHeight + travelHeight) % travelHeight - treeHeight;
  
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
        top,
        width: tWidth,
        height: treeHeight,
        resizeMode: "contain",
        zIndex: 10,
      }}
    />
  );
};
