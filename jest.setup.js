jest.mock('react-native-gesture-handler', () => {
  return {
    GestureHandlerRootView: 'GestureHandlerRootView',
    PanGestureHandler: 'PanGestureHandler',
    State: {},
    TouchableOpacity: 'TouchableOpacity',
  };
});

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({
      type: 'success',
      data: { idToken: 'mock-google-id-token' },
    })),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = new Map();

  return {
    setItem: jest.fn(async (key, value) => {
      storage.set(key, value);
    }),
    getItem: jest.fn(async key => {
      return storage.has(key) ? storage.get(key) : null;
    }),
    removeItem: jest.fn(async key => {
      storage.delete(key);
    }),
    clear: jest.fn(async () => {
      storage.clear();
    }),
  };
});
