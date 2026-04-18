import React from "react";
import { StyleSheet, View } from "react-native";

export const roadLineWidth = 8;
export const centerDashHeight = 24;
export const centerDashGap = 36;

type TrackLinesProps = {
  centerLineOffset: number;
  dashCount: number;
};

export const TrackLines = ({ centerLineOffset, dashCount }: TrackLinesProps) => {
  return (
    <>
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
    </>
  );
};

const styles = StyleSheet.create({
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
});
