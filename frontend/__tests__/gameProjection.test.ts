import {
  getDepthScale,
  getRoadBoundsAtScreenY,
  getRoadWidthAtScreenY,
  projectRoadX,
} from '../utils/gameProjection';

const config = {
  viewportWidth: 400,
  viewportHeight: 800,
  topRoadWidth: 136,
  bottomRoadWidth: 360,
};

describe('gameProjection', () => {
  test('road is much narrower at the horizon than at the bottom', () => {
    const topWidth = getRoadWidthAtScreenY(0, config);
    const bottomWidth = getRoadWidthAtScreenY(config.viewportHeight, config);

    expect(topWidth).toBeLessThan(bottomWidth);
    expect(bottomWidth).toBe(360);
    expect(topWidth).toBe(136);
  });

  test('projected road x stays within the current road bounds', () => {
    const samples = [40, 400, 760];

    for (const screenY of samples) {
      const bounds = getRoadBoundsAtScreenY(screenY, config);

      expect(projectRoadX(0, screenY, config)).toBeCloseTo(bounds.left);
      expect(projectRoadX(0.5, screenY, config)).toBeGreaterThan(bounds.left);
      expect(projectRoadX(1, screenY, config)).toBeCloseTo(bounds.right);
    }
  });

  test('sprite scale increases as objects move closer to y=0', () => {
    expect(getDepthScale(0.15, 0.42, 1)).toBeGreaterThan(
      getDepthScale(0.85, 0.42, 1),
    );
  });
});
