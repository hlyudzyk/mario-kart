export type PerspectiveRoadConfig = {
  viewportWidth: number;
  viewportHeight: number;
  topRoadWidth: number;
  bottomRoadWidth: number;
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const getWorldProgress = (worldY: number) => Math.max(0, 1 - worldY);

export const getScreenYForWorldY = (
  worldY: number,
  verticalTravel: number,
) => verticalTravel * getWorldProgress(worldY);

export const getDepthScale = (
  worldY: number,
  minScale: number,
  maxScale: number,
) => {
  const progress = Math.pow(getWorldProgress(worldY), 0.82);

  return lerp(minScale, maxScale, progress);
};

export const getRoadWidthAtScreenY = (
  screenY: number,
  config: PerspectiveRoadConfig,
) => {
  const progress = Math.max(0,
    config.viewportHeight <= 0 ? 1 : screenY / config.viewportHeight,
  );
  const easedProgress = Math.pow(progress, 1.28);

  return lerp(config.topRoadWidth, config.bottomRoadWidth, easedProgress);
};

export const getRoadBoundsAtScreenY = (
  screenY: number,
  config: PerspectiveRoadConfig,
) => {
  const width = getRoadWidthAtScreenY(screenY, config);
  const left = (config.viewportWidth - width) / 2;

  return {
    left,
    right: left + width,
    width,
  };
};

export const projectRoadX = (
  roadX: number,
  screenY: number,
  config: PerspectiveRoadConfig,
) => {
  const bounds = getRoadBoundsAtScreenY(screenY, config);

  return bounds.left + bounds.width * clamp01(roadX);
};
