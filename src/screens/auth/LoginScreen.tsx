import { useCallback, useRef, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  APP_NAME,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from '../../constants';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  clearAuthError,
  clearInfoMessage,
  login,
  loginWithGoogle,
} from '../../redux/slices/authSlice';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
let isGoogleConfigured = false;
const GOOGLE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
</svg>
`;

function mapGoogleError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'SIGN_IN_CANCELLED'
  ) {
    return 'Google sign-in was cancelled.';
  }

  return 'Google sign-in is not available on this build.';
}


export function LoginScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const contentWidth = isTablet ? Math.min(width - 64, 620) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.auth.status);
  const error = useAppSelector(state => state.auth.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const isLoading = status === 'loading';
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
      dispatch(clearInfoMessage());
      setGoogleError(null);
    }, [dispatch]),
  );

  async function handleLogin() {
    dispatch(clearAuthError());
    await dispatch(login({ email: email.trim(), password }));
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>


      <View style={styles.center}>
        <View style={[styles.card, { width: contentWidth, alignSelf: 'center' }]}>

          <View style={styles.cardAnimation}>
            <Animated.View
              style={[
                styles.logo,
                {
                  transform: [{ scale: logoScale }],
                  opacity: logoOpacity,
                },
              ]}
            >
              <Text style={styles.LogoTitle}>Phantoms</Text>
            </Animated.View>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Login to {APP_NAME}</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="test@mail.com"
            placeholderTextColor="#7D8597"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Password"
              placeholderTextColor="#7D8597"
              style={[styles.input, styles.inputWithIcon]}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(s => !s)} style={styles.iconBtn}>
              {showPassword ? (
                <Ionicons name="eye-off-outline" size={20} color="#9CA3AF" />
              ) : (
                <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              pressed && !isLoading && { opacity: 0.9 },
            ]}>
            {isLoading ? (
              <ActivityIndicator color="#0D1321" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.links}>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Forgot password</Text>
            </Pressable>
          </View>

        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          disabled={isLoading}
          onPress={async () => {
            setGoogleError(null);
            dispatch(clearAuthError());
            let cancelledCode = 'SIGN_IN_CANCELLED';
            try {
              const mod = await import('@react-native-google-signin/google-signin');
              const { GoogleSignin, statusCodes } = mod;
              cancelledCode = statusCodes.SIGN_IN_CANCELLED;

              if (!isGoogleConfigured) {
                if (!GOOGLE_WEB_CLIENT_ID) {
                  setGoogleError(
                    'Google Sign-In ucun GOOGLE_WEB_CLIENT_ID daxil edilmelidir.',
                  );
                  return;
                }

                if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) {
                  setGoogleError(
                    'iOS Google Sign-In ucun GOOGLE_IOS_CLIENT_ID ve ya GoogleService-Info.plist lazimdir.',
                  );
                  return;
                }

                GoogleSignin.configure(
                  Platform.OS === 'ios'
                    ? {
                      webClientId: GOOGLE_WEB_CLIENT_ID,
                      iosClientId: GOOGLE_IOS_CLIENT_ID,
                    }
                    : { webClientId: GOOGLE_WEB_CLIENT_ID },
                );
                isGoogleConfigured = true;
              }

              await GoogleSignin.hasPlayServices();

              const result = await GoogleSignin.signIn();
              if (result.type !== 'success') {
                return;
              }

              const token = result.data.idToken?.trim() ?? '';
              if (!token) {
                throw new Error(
                  'Google ID token is missing. Add a valid web client id in constants.',
                );
              }

              await dispatch(loginWithGoogle(token.trim()));
            } catch (error) {
              if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                (error as { code?: string }).code === cancelledCode
              ) {
                return;
              }

              setGoogleError(mapGoogleError(error));
            }
          }}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && !isLoading && { opacity: 0.9 },
          ]}>
          <View style={styles.googleIcon}>
            <SvgXml xml={GOOGLE_ICON_SVG} width={20} height={20} />
          </View>
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>

        {googleError ? <Text style={styles.error}>{googleError}</Text> : null}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    borderRadius: 28,
    backgroundColor: '#101826',
    padding: 22,
  },

  logo: {
    width: 200,
    height: 70,
    borderRadius: 40,
    backgroundColor: '#101826',
    alignItems: 'center',
    justifyContent: 'center',

    position: 'absolute',
    top: -50,
    alignSelf: 'center',

    borderBlockColor: '#D4B483',
    borderWidth: 2.5,

    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardAnimation: {
    // width: 100,
    height: 50,
    // alignSelf: 'center',
    // marginBottom: 10,
  },

  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  LogoTitle: {
    // color: '#273346',
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 14,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#273346',
    color: '#DDE6F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    borderRadius: 14,
    backgroundColor: '#1F2937',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#F9FAFB',
    fontSize: 14,
  },

  error: {
    marginTop: 10,
    color: '#FCA5A5',
    fontSize: 13,
  },

  button: {
    marginTop: 18,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#D4B483',
    paddingVertical: 14,
  },

  buttonText: {
    color: '#0D1321',
    fontSize: 14,
    fontWeight: '800',
  },

  links: {
    marginTop: 16,
    gap: 10,
  },

  link: {
    color: '#D4B483',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  bottom: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: '88%',
    maxWidth: 620,
  },

  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderTopColor: 'rgb(25, 118, 210)',
    borderRightColor: 'rgb(76, 175, 80)',
    borderBottomColor: 'rgb(255, 193, 7)',
    borderLeftColor: 'rgb(255, 61, 0)',
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  googleText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },

  inputRow: {
    position: 'relative',
    marginTop: 0,
  },

  inputWithIcon: {
    paddingRight: 44,
  },

  iconBtn: {
    position: 'absolute',
    right: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

});
