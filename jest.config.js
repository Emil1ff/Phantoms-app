module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|react-redux|@reduxjs/toolkit|redux|immer|reselect|redux-thunk|lottie-react-native|react-native-safe-area-context|@react-native-async-storage/async-storage)/)',
  ],
};
