module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(mp3)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|react-native-screens)/)',
  ],
};
