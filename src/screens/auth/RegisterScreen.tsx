import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SvgXml } from 'react-native-svg';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  clearAuthError,
  clearInfoMessage,
  loginWithGoogle,
  registerUser,
} from '../../redux/slices/authSlice';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
let isGoogleConfigured = false;
const STEP_LABELS = ['Profile', 'Account', 'Security'] as const;
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

function getPasswordStrength(value: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (/[A-Z]/.test(value) || /\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 10) score += 1;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

export function RegisterScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const contentWidth = isTablet ? Math.min(width - 64, 700) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.auth.status);
  const error = useAppSelector(state => state.auth.error);
  const infoMessage = useAppSelector(state => state.auth.infoMessage);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const isLoading = status === 'loading';
  const hasProfileFields =
    firstName.trim().length > 0 && lastName.trim().length > 0;
  const hasAccountFields =
    email.trim().length > 0 && userName.trim().length > 0;
  const hasSecurityFields =
    password.length > 0 && confirmPassword.length > 0;
  const isPasswordMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordStrength = getPasswordStrength(password);

  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
      dispatch(clearInfoMessage());
      setLocalError(null);
      setGoogleError(null);
    }, [dispatch]),
  );

  async function handleRegister() {
    const trimmedEmail = email.trim();
    const trimmedUserName = userName.trim();

    dispatch(clearAuthError());
    dispatch(clearInfoMessage());
    setLocalError(null);

    if (!hasProfileFields || !hasAccountFields || !hasSecurityFields) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    await dispatch(
      registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        userName: trimmedUserName,
        password,
      }),
    );
  }

  function handleNextStep() {
    setLocalError(null);

    if (stepIndex === 0 && !hasProfileFields) {
      setLocalError('Please enter your first and last name.');
      return;
    }

    if (stepIndex === 1) {
      if (!hasAccountFields) {
        setLocalError('Please enter email and username.');
        return;
      }

      if (!email.trim().includes('@')) {
        setLocalError('Please enter a valid email address.');
        return;
      }
    }

    if (stepIndex === 2) {
      return;
    }

    setStepIndex(current => current + 1);
  }

  function handleStepPress(index: number) {
    if (index === stepIndex) {
      return;
    }

    if (index < stepIndex) {
      setLocalError(null);
      setStepIndex(index);
      return;
    }

    handleNextStep();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 140 },
        ]}>
        <View style={styles.center}>
          <View style={styles.emptyArea}></View>
          <View style={[styles.card, { width: contentWidth, alignSelf: 'center' }]}>
            <View style={styles.cardAnimation}>
              <View style={styles.logo}>
                <Text style={styles.LogoTitle}>Phantoms</Text>
              </View>
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Fast signup, secure access.</Text>

            <View style={styles.stepTabs}>
              {STEP_LABELS.map((label, index) => {
                const isActive = index === stepIndex;
                const isComplete = index < stepIndex;
                return (
                  <Pressable
                    key={label}
                    onPress={() => handleStepPress(index)}
                    style={({ pressed }) => [
                      styles.stepPill,
                      isActive && styles.stepPillActive,
                      isComplete && styles.stepPillComplete,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepPillText,
                        isActive && styles.stepPillTextActive,
                        isComplete && styles.stepPillTextComplete,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          {stepIndex === 0 ? (
            <>
              <Text style={styles.label}>First name</Text>
              <TextInput
                placeholder="John"
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.label}>Last name</Text>
              <TextInput
                placeholder="Doe"
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          ) : null}

          {stepIndex === 1 ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="test@mail.com"
                keyboardType="email-address"
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={email}
                autoCapitalize="none"
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Username</Text>
              <TextInput
                placeholder="@username"
                placeholderTextColor="#7D8597"
                style={styles.input}
                value={userName}
                autoCapitalize="none"
                onChangeText={setUserName}
              />
            </>
          ) : null}

          {stepIndex === 2 ? (
            <>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Min 6 characters"
                  placeholderTextColor="#7D8597"
                  style={[styles.input, styles.inputWithIcon]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword(s => !s)}
                  style={styles.iconBtn}
                >
                  {showPassword ? (
                    <Ionicons name="eye-off-outline" size={20} color="#9CA3AF" />
                  ) : (
                    <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
              <View style={styles.strengthRow}>
                {[0, 1, 2].map(index => {
                  const isActive = passwordStrength > index;
                  return (
                    <View
                      key={`strength-${index}`}
                      style={[
                        styles.strengthBar,
                        isActive && styles.strengthBarActive,
                        index === 0 && isActive && styles.strengthBarWeak,
                        index === 1 && isActive && styles.strengthBarMedium,
                        index === 2 && isActive && styles.strengthBarStrong,
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  placeholder="Repeat password"
                  placeholderTextColor="#7D8597"
                  style={[styles.input, styles.inputWithIcon]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(s => !s)}
                  style={styles.iconBtn}
                >
                  {showConfirmPassword ? (
                    <Ionicons name="eye-off-outline" size={20} color="#9CA3AF" />
                  ) : (
                    <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
            </>
          ) : null}

          {localError ? <Text style={styles.error}>{localError}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {infoMessage ? <Text style={styles.success}>{infoMessage}</Text> : null}

          <View style={styles.actions}>
            {stepIndex > 0 ? (
              <Pressable
                onPress={() => setStepIndex(current => current - 1)}
                style={({ pressed }) => [
                  styles.buttonSecondary,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <Text style={styles.buttonSecondaryText}>Back</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={stepIndex === 2 ? handleRegister : handleNextStep}
              style={({ pressed }) => [
                styles.button,
                pressed && !isLoading && { opacity: 0.92 },
                (stepIndex === 0 && !hasProfileFields) && styles.buttonDisabled,
                (stepIndex === 1 && !hasAccountFields) && styles.buttonDisabled,
                (stepIndex === 2 && (!hasSecurityFields || !isPasswordMatch || isLoading)) &&
                  styles.buttonDisabled,
              ]}
              disabled={
                isLoading ||
                (stepIndex === 0 && !hasProfileFields) ||
                (stepIndex === 1 && !hasAccountFields) ||
                  (stepIndex === 2 && (!hasSecurityFields || !isPasswordMatch))
              }
            >
              {isLoading && stepIndex === 2 ? (
                <ActivityIndicator color="#0D1321" />
              ) : (
                <Text style={styles.buttonText}>
                  {stepIndex === 2 ? 'Create account' : 'Next'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Sign in</Text>
          </Pressable>
          </View>
        </View>
        <View style={[styles.bottom, { width: contentWidth, alignSelf: 'center' }]}>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 20,
    // justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  LogoTitle: {
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
  stepTabs: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 12,
  },
  stepPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#273346',
  },
  stepPillActive: {
    backgroundColor: '#D4B483',
  },
  stepPillComplete: {
    backgroundColor: '#D4B483',
  },
  stepPillText: {
    color: '#DDE6F7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepPillTextActive: {
    color: '#0D1321',
  },
  stepPillTextComplete: {
    color: '#0D1321',
  },
  emptyArea:{
    height: 120,
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#101826',
    padding: 22,
  },
  logo: {
    width: 200,
    height: 90,
    borderRadius: 60,
    backgroundColor: '#101826',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    position: 'absolute',
    top: -60,
    left: 60,
    borderBlockColor: '#D4B483',
    borderWidth: 4,
  },
  cardAnimation: {
    height: 50,
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
  inputRow: {
    position: 'relative',
  },
  strengthRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#2A3546',
  },
  strengthBarActive: {
    backgroundColor: '#E4D2B3',
  },
  strengthBarWeak: {
    backgroundColor: '#EF4444',
  },
  strengthBarMedium: {
    backgroundColor: '#F59E0B',
  },
  strengthBarStrong: {
    backgroundColor: '#22C55E',
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  iconBtn: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  button: {
    marginTop: 18,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#D4B483',
    paddingVertical: 14,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    marginTop: 18,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  buttonSecondaryText: {
    color: '#F9FAFB',
    fontWeight: '700',
  },
  buttonText: {
    color: '#0D1321',
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  success: {
    color: '#A7F3D0',
    fontSize: 13,
  },
  link: {
    marginTop: 16,
    color: '#D4B483',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    bottom: 50,
    width: '88%',
    maxWidth: 700,
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
  googleIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
