import React from "react";
import { StyleSheet, View } from "react-native";

export const roadLineWidth = 8;
export const centerDashHeight = 24;
export const centerDashGap = 36;

type TrackLinesProps = {
  centerLineOffset: number;
  dashCount: number;
  scrollOffset: number;
};

export const TrackLines = ({ centerLineOffset, dashCount, scrollOffset }: TrackLinesProps) => {
  const dashCycle = centerDashHeight + centerDashGap;
  const totalHeight = dashCount * dashCycle;

  return (
    <>
      <View pointerEvents="none" style={[styles.divider, styles.leftDivider]} />
      <View pointerEvents="none" style={[styles.divider, styles.rightDivider]} />
      <View pointerEvents="none" style={[styles.centerLine, { left: centerLineOffset }]}>
        {Array.from({ length: dashCount }).map((_, index) => {
          const top =
            ((index * dashCycle + scrollOffset) % totalHeight + totalHeight) % totalHeight;

          return (
            <View
              key={index}
              style={[
                styles.centerLineDash,
                { top },
              ]}
            />
          );
        })}
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
    zIndex: 1,
  },
  centerLineDash: {
    position: "absolute",
    width: roadLineWidth,
    height: centerDashHeight,
    backgroundColor: "#fff",
  },
});
