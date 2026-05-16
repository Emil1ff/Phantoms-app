import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../redux/slices/authSlice';
import { t } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width >= 768 ? Math.min(width - 64, 760) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const { theme, language } = useAppSelector(state => state.ui);
  const isDark = theme === 'dark';

  const palette = {
    bg: isDark ? '#0B1220' : '#F4F1EA',
    hero: isDark ? '#111C31' : '#101826',
    text: isDark ? '#F3F4F6' : '#FFFFFF',
    muted: isDark ? '#9CA3AF' : '#A8B1C3',
    card: isDark ? '#0F1A2D' : '#FFFFFF',
    cardText: isDark ? '#F3F4F6' : '#111827',
    border: isDark ? '#24344F' : '#E5E7EB',
    action: isDark ? '#D4B483' : '#101826',
    actionText: isDark ? '#111827' : '#F4F1EA',
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          backgroundColor: palette.bg,
        },
      ]}>
      <View style={{ width: contentWidth, alignSelf: 'center' }}>
      <View style={[styles.hero, { backgroundColor: palette.hero }]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={38} color="#F4F1EA" />
        </View>
        <Text style={[styles.title, { color: palette.text }]}>
          {session?.fullName ?? t(language, 'profile')}
        </Text>
        <Text style={[styles.email, { color: palette.muted }]}>{session?.email ?? '-'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.cardTitle, { color: palette.cardText }]}>{t(language, 'profile')}</Text>
        <Text style={[styles.cardMeta, { color: palette.muted }]}>
          {session?.roles?.join(', ') || '-'}
        </Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate('ChangePassword')}
        style={[styles.secondaryButton, { borderColor: palette.border }]}>
        <Text style={[styles.secondaryButtonText, { color: palette.cardText }]}>
          {t(language, 'change_password')}
        </Text>
      </Pressable>

      <Pressable onPress={() => dispatch(logout())} style={styles.logoutButton}>
        <Text style={styles.logoutText}>{t(language, 'logout')}</Text>
      </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2B3B56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '800',
  },
  email: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 8, fontSize: 14 },
  primaryButton: {
    marginTop: 14,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  primaryButtonText: { fontWeight: '800', fontSize: 14 },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: { fontWeight: '700', fontSize: 14 },
  logoutButton: {
    marginTop: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 13,
  },
  logoutText: { color: '#F9FAFB', fontWeight: '800' },
});
