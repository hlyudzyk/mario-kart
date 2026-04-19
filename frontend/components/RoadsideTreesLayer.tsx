import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Tree, TreeData } from './Tree';
import {
  getRoadBoundsAtScreenY,
  lerp,
  PerspectiveRoadConfig,
} from '../utils/gameProjection';

const TREE_SCROLL_SPEED = 0.2;
const COMMIT_INTERVAL_MS = 33;
const TREE_ASPECT_RATIO = 1.55;

type RoadsideTreesLayerProps = PerspectiveRoadConfig & {
  treeBaseWidth: number;
  treeCount: number;
  source: number;
};

const seededUnit = (seed: number) => {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;

  return raw - Math.floor(raw);
};

const createTrees = (treeCount: number, seedOffset: number): TreeData[] =>
  Array.from({ length: treeCount }).map((_, index) => ({
    top: index * 150 + (seededUnit(index + seedOffset) * 200 - 100),
    scale: 0.78 + seededUnit(index + seedOffset * 2) * 0.42,
    offsetX: (seededUnit(index + seedOffset * 3) - 0.5) * 70,
  }));

export const RoadsideTreesLayer = memo(
  ({
    viewportWidth,
    viewportHeight,
    topRoadWidth,
    bottomRoadWidth,
    treeBaseWidth,
    treeCount,
    source,
  }: RoadsideTreesLayerProps) => {
    const [scrollOffset, setScrollOffset] = useState(0);
    const scrollRef = useRef(0);
    const roadConfig = useMemo(
      () => ({
        viewportWidth,
        viewportHeight,
        topRoadWidth,
        bottomRoadWidth,
      }),
      [bottomRoadWidth, topRoadWidth, viewportHeight, viewportWidth],
    );
    const leftTrees = useMemo(() => createTrees(treeCount, 11), [treeCount]);
    const rightTrees = useMemo(() => createTrees(treeCount, 41), [treeCount]);
    const treeTravelHeight =
      viewportHeight + treeBaseWidth * TREE_ASPECT_RATIO * 1.8 + 180;

    useEffect(() => {
      let frame = 0;
      let lastTime: number | null = null;
      let lastCommit: number | null = null;

      const animate = (time: number) => {
        const previousTime = lastTime ?? time;
        const delta = time - previousTime;
        lastTime = time;
        scrollRef.current =
          (scrollRef.current + delta * TREE_SCROLL_SPEED) % treeTravelHeight;

        if (lastCommit === null || time - lastCommit >= COMMIT_INTERVAL_MS) {
          lastCommit = time;
          setScrollOffset(scrollRef.current);
        }

        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(frame);
      };
    }, [treeTravelHeight]);

    const getTreePlacement = (tree: TreeData, side: 'left' | 'right') => {
      const baseY =
        ((tree.top + scrollOffset) % treeTravelHeight + treeTravelHeight) %
        treeTravelHeight;
      const depthProgress = Math.max(
        0.04,
        Math.min(1, baseY / Math.max(viewportHeight, 1)),
      );
      const sizeScale =
        tree.scale * lerp(0.34, 1.12, Math.pow(depthProgress, 1.08));
      const width = treeBaseWidth * sizeScale;
      const height = width * TREE_ASPECT_RATIO;
      const top = baseY - height;
      const roadBounds = getRoadBoundsAtScreenY(baseY, roadConfig);
      const roadsideGap = lerp(12, 28, depthProgress);
      const lateralOffset = tree.offsetX * lerp(0.28, 1, depthProgress);
      const left =
        side === 'left'
          ? roadBounds.left - width - roadsideGap + lateralOffset
          : roadBounds.right + roadsideGap + lateralOffset;

      return {
        left,
        top,
        width,
        height,
        zIndex: 8 + Math.round(depthProgress * 10),
      };
    };

    return (
      <>
        {leftTrees.map((tree, index) => {
          const placement = getTreePlacement(tree, 'left');

          return (
            <Tree
              key={`left-tree-${index}`}
              left={placement.left}
              top={placement.top}
              width={placement.width}
              height={placement.height}
              zIndex={placement.zIndex}
              source={source}
            />
          );
        })}
        {rightTrees.map((tree, index) => {
          const placement = getTreePlacement(tree, 'right');

          return (
            <Tree
              key={`right-tree-${index}`}
              left={placement.left}
              top={placement.top}
              width={placement.width}
              height={placement.height}
              zIndex={placement.zIndex}
              source={source}
            />
          );
        })}
      </>
    );
  },
);
