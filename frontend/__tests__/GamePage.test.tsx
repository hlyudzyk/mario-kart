import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image, StyleSheet } from 'react-native';
import * as ReactNative from 'react-native';
import { GamePage } from '../pages/GamePage';

jest.mock('react-native-sound', () => {
  return class MockSound {
    static setCategory = jest.fn();

    constructor(
      _filename: unknown,
      callback?: (error?: unknown) => void,
    ) {
      callback?.();
    }

    setNumberOfLoops = jest.fn(() => this);
    setCurrentTime = jest.fn(() => this);
    play = jest.fn(() => this);
    stop = jest.fn((callback?: () => void) => {
      callback?.();
      return this;
    });
    release = jest.fn(() => this);
  };
});

jest.mock('react-native-svg', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');

  const MockSvg = ({ children, ...props }: React.PropsWithChildren<object>) =>
    ReactLib.createElement(View, props, children);

  return {
    __esModule: true,
    default: MockSvg,
    Line: MockSvg,
    Polygon: MockSvg,
    Rect: MockSvg,
  };
});

class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  close() {}
}

describe('GamePage', () => {
  const dimensionsSpy = jest.spyOn(ReactNative, 'useWindowDimensions');
  const resolveAssetSourceSpy = jest.spyOn(Image, 'resolveAssetSource');

  beforeEach(() => {
    dimensionsSpy.mockReturnValue({
      width: 400,
      height: 800,
      scale: 2,
      fontScale: 2,
    });
    resolveAssetSourceSpy.mockReturnValue({
      uri: 'https://example.com/mariokart-theme.mp3',
      width: 1,
      height: 1,
      scale: 1,
    });
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    globalThis.requestAnimationFrame = jest.fn(() => 1);
    globalThis.cancelAnimationFrame = jest.fn();
  });

  afterAll(() => {
    dimensionsSpy.mockRestore();
    resolveAssetSourceSpy.mockRestore();
  });

  test('renders the projected scene and keeps the local kart size fixed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<GamePage />);
    });

    const root = renderer!.root;
    expect(root.findByProps({ testID: 'road-layer' })).toBeTruthy();

    const localKart = root.find(
      node => node.props.testID === 'local-kart' && node.props.style,
    );
    const localKartStyle = StyleSheet.flatten(localKart.props.style);

    expect(localKartStyle.width).toBe(126);
    expect(localKartStyle.height).toBe(126);

    await ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });
});
