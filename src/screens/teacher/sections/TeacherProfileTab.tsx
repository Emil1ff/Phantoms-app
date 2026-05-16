import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = {
  name?: string | null;
  email?: string | null;
  canSwitchPanels: boolean;
  roleCount: number;
  onOpenProfile: () => void;
  onLogout: () => void;
  onSwitchPanel: () => void;
};

export function TeacherProfileTab({ name, email, canSwitchPanels, roleCount, onOpenProfile, onLogout, onSwitchPanel }: Props) {
  return (
    <View style={sectionStyles.profileCard}>
      <View style={sectionStyles.avatarRow}>
        <View style={sectionStyles.avatar}><Ionicons name="person-outline" size={22} color="#101826" /></View>
        <View style={sectionStyles.profileTextWrap}>
          <Text style={sectionStyles.profileTitle}>{name ?? 'Teacher'}</Text>
          <Text style={sectionStyles.profileMeta}>{email ?? '-'}</Text>
          <Text style={sectionStyles.profileMeta}>{roleCount} role(s)</Text>
        </View>
      </View>

      <View style={sectionStyles.cardActions}>
        <Pressable onPress={onOpenProfile} style={sectionStyles.secondaryAction}>
          <Text style={sectionStyles.secondaryActionText}>Open profile</Text>
        </Pressable>
        {canSwitchPanels ? (
          <Pressable onPress={onSwitchPanel} style={[sectionStyles.secondaryAction, sectionStyles.switchAction]}>
            <Text style={sectionStyles.switchActionText}>Switch panel</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={onLogout} style={sectionStyles.logoutButton}>
        <Text style={sectionStyles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  profileCard: { marginTop: 12, borderRadius: 24, backgroundColor: '#101826', padding: 18 },
  avatarRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F4F1EA', alignItems: 'center', justifyContent: 'center' },
  profileTextWrap: { flex: 1 },
  profileTitle: { color: '#F4F1EA', fontSize: 22, fontWeight: '800' },
  profileMeta: { marginTop: 4, color: '#B8C3D6', fontSize: 13, fontWeight: '600' },
  cardActions: { marginTop: 16, flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#EEE8DD', paddingVertical: 12 },
  secondaryActionText: { color: '#101826', fontWeight: '800' },
  switchAction: { backgroundColor: '#24344F' },
  switchActionText: { color: '#F4F1EA', fontWeight: '800' },
  logoutButton: { marginTop: 14, alignItems: 'center', borderRadius: 16, backgroundColor: '#D4B483', paddingVertical: 14 },
  logoutText: { color: '#101826', fontSize: 15, fontWeight: '800' },
});