/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image } from 'react-native';

jest.mock('react-native-sound', () => {
  return class MockSound {
    static setCategory = jest.fn();

    constructor(
      _filename: unknown,
      callback?: (error?: unknown) => void,
    ) {
      callback?.();
    }

    setVolume = jest.fn(() => this);
    setNumberOfLoops = jest.fn(() => this);
    play = jest.fn(() => this);
    stop = jest.fn(() => this);
    release = jest.fn(() => this);
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

import App from '../App';

test('renders correctly', async () => {
  const resolveAssetSourceSpy = jest
    .spyOn(Image, 'resolveAssetSource')
    .mockReturnValue({
      uri: 'https://example.com/mariobros-theme.mp3',
      width: 1,
      height: 1,
      scale: 1,
    });

  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });

  resolveAssetSourceSpy.mockRestore();
});
