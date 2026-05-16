import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../../../i18n';

type Props = {
  session: any;
  language: any;
  isDark?: boolean;
  onOpenProfile: () => void;
  onLogout: () => void;
};

export function ClientProfileTab({ session, language, isDark = false, onOpenProfile, onLogout }: Props) {
  const palette = {
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F3F4F6' : '#0F172A',
    muted: isDark ? '#9CA3AF' : '#475569',
    primary: isDark ? '#D4B483' : '#101826',
    primaryText: isDark ? '#111827' : '#F4F1EA',
    danger: '#B91C1C',
  };

  return (
    <>
      <View style={[cp.card, { backgroundColor: palette.card }]}> 
        <Text style={[cp.name, { color: palette.text }]}>{session?.fullName ?? t(language, 'user')}</Text>
        <Text style={[cp.meta, { color: palette.muted }]}>{session?.email ?? '-'}</Text>
        <Text style={[cp.meta, { color: palette.muted }]}>{t(language, 'roles')}: {session?.roles?.join(', ') || '-'}</Text>
      </View>

      <Pressable onPress={onOpenProfile} style={[cp.btn, { backgroundColor: palette.primary }]}> 
        <Text style={[cp.btnText, { color: palette.primaryText }]}>{t(language, 'open_full_profile')}</Text>
      </Pressable>

      <Pressable onPress={onLogout} style={[cp.btn, { backgroundColor: palette.danger }]}> 
        <Text style={[cp.btnText, { color: '#FFFFFF' }]}>{t(language, 'logout')}</Text>
      </Pressable>
    </>
  );
}

const cp = StyleSheet.create({
  card: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  name: { fontSize: 20, fontWeight: '800' },
  meta: { marginTop: 6, fontSize: 13 },
  btn: { marginTop: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  btnText: { fontWeight: '800' },
});
