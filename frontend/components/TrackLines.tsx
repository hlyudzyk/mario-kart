import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Line, Polygon, Rect } from 'react-native-svg';
import {
  getRoadBoundsAtScreenY,
  lerp,
  PerspectiveRoadConfig,
} from '../utils/gameProjection';

const ROAD_SCROLL_SPEED = 0.24;
const COMMIT_INTERVAL_MS = 33;
const DASH_GAP = 74;
const ROAD_EDGE_COLOR = '#fff7db';

type TrackLinesProps = PerspectiveRoadConfig;

export const TrackLines = memo(
  ({
    viewportWidth,
    viewportHeight,
    topRoadWidth,
    bottomRoadWidth,
  }: TrackLinesProps) => {
    const [scrollPhase, setScrollPhase] = useState(0);
    const phaseRef = useRef(0);

    const roadConfig = useMemo(
      () => ({
        viewportWidth,
        viewportHeight,
        topRoadWidth,
        bottomRoadWidth,
      }),
      [bottomRoadWidth, topRoadWidth, viewportHeight, viewportWidth],
    );

    useEffect(() => {
      let frame = 0;
      let lastTime: number | null = null;
      let lastCommit: number | null = null;
      const totalHeight = viewportHeight + DASH_GAP * 2;

      const animate = (time: number) => {
        const previousTime = lastTime ?? time;
        const delta = time - previousTime;
        lastTime = time;
        phaseRef.current = (phaseRef.current + delta * ROAD_SCROLL_SPEED) % totalHeight;

        if (lastCommit === null || time - lastCommit >= COMMIT_INTERVAL_MS) {
          lastCommit = time;
          setScrollPhase(phaseRef.current);
        }

        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [viewportHeight]);

    const topBounds = getRoadBoundsAtScreenY(0, roadConfig);
    const bottomBounds = getRoadBoundsAtScreenY(viewportHeight, roadConfig);
    const polygonPoints = [
      `${topBounds.left},0`,
      `${topBounds.right},0`,
      `${bottomBounds.right},${viewportHeight}`,
      `${bottomBounds.left},${viewportHeight}`,
    ].join(' ');

    const dashCount = Math.ceil(viewportHeight / DASH_GAP) + 4;
    const dashes = Array.from({ length: dashCount }, (_, index) => {
      const centerY =
        ((index * DASH_GAP + scrollPhase) % (viewportHeight + DASH_GAP * 2)) - DASH_GAP;

      if (centerY < -40 || centerY > viewportHeight + 40) {
        return null;
      }

      const bounds = getRoadBoundsAtScreenY(centerY, roadConfig);
      const progress = Math.max(0, Math.min(1, centerY / Math.max(viewportHeight, 1)));
      const dashWidth = Math.max(4, bounds.width * 0.034);
      const dashHeight = lerp(12, 42, progress);

      return {
        key: `dash-${index}`,
        x: bounds.left + bounds.width / 2 - dashWidth / 2,
        y: centerY - dashHeight / 2,
        width: dashWidth,
        height: dashHeight,
        rx: dashWidth / 2,
      };
    }).filter(Boolean) as Array<{
      key: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
    }>;

    return (
      <Svg
        testID="road-layer"
        width={viewportWidth}
        height={viewportHeight}
        style={styles.layer}
      >
        <Polygon points={polygonPoints} fill="#50545b" />
        <Line
          x1={topBounds.left}
          y1={0}
          x2={bottomBounds.left}
          y2={viewportHeight}
          stroke={ROAD_EDGE_COLOR}
          strokeWidth={7}
        />
        <Line
          x1={topBounds.right}
          y1={0}
          x2={bottomBounds.right}
          y2={viewportHeight}
          stroke={ROAD_EDGE_COLOR}
          strokeWidth={7}
        />
        {dashes.map(dash => (
          <Rect
            key={dash.key}
            x={dash.x}
            y={dash.y}
            width={dash.width}
            height={dash.height}
            rx={dash.rx}
            fill={ROAD_EDGE_COLOR}
          />
        ))}
      </Svg>
    );
  },
);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
