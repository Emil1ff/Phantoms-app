import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  resetPasswordRequest,
} from '../../redux/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const contentWidth = isTablet ? Math.min(width - 64, 620) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.auth.status);
  const error = useAppSelector(state => state.auth.error);
  const infoMessage = useAppSelector(state => state.auth.infoMessage);

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isLoading = status === 'loading';

  useFocusEffect(
    useCallback(() => {
      dispatch(clearAuthError());
      dispatch(clearInfoMessage());
    }, [dispatch]),
  );

  async function handleReset() {
    dispatch(clearAuthError());
    dispatch(clearInfoMessage());
    const result = await dispatch(
      resetPasswordRequest({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      }),
    );

    if (resetPasswordRequest.fulfilled.match(result)) {
      navigation.navigate('Login');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + 40 },
        ]}>
        <View style={styles.center}>
          <View style={[styles.card, { width: contentWidth, alignSelf: 'center' }]}>
            <View style={styles.cardAnimation}>
              <View style={styles.logo}>
                <Text style={styles.LogoTitle}>Phantoms</Text>
              </View>
            </View>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter the token we sent and choose a new password.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="test@mail.com"
              placeholderTextColor="#7D8597"
              style={styles.input}
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.label}>Token</Text>
            <TextInput
              placeholder="Verification token"
              placeholderTextColor="#7D8597"
              style={styles.input}
              value={token}
              onChangeText={setToken}
            />
            <Text style={styles.label}>New password</Text>
            <TextInput
              placeholder="New password"
              placeholderTextColor="#7D8597"
              style={styles.input}
              value={newPassword}
              secureTextEntry
              onChangeText={setNewPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {infoMessage ? <Text style={styles.success}>{infoMessage}</Text> : null}
            <Pressable onPress={handleReset} style={styles.button} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#0D1321" />
              ) : (
                <Text style={styles.buttonText}>Reset password</Text>
              )}
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Back to login</Text>
            </Pressable>
          </View>
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
  error: {
    marginTop: 10,
    color: '#FCA5A5',
    fontSize: 13,
  },
  success: {
    marginTop: 10,
    color: '#A7F3D0',
    fontSize: 13,
  },
  link: {
    marginTop: 14,
    textAlign: 'center',
    color: '#D4B483',
    fontSize: 13,
    fontWeight: '700',
  },
});
