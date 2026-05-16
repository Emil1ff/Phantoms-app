import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../redux/slices/authSlice';

export function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);
  const isDark = theme === 'dark';

  return (
    <View style={[pa.root, { paddingTop: insets.top + 30, backgroundColor: isDark ? '#0B1220' : '#F4F1EA' }]}> 
      <View style={[pa.card, { backgroundColor: isDark ? '#111C31' : '#FFFFFF', borderColor: isDark ? '#24344F' : '#E2E8F0' }]}> 
        <View style={pa.iconWrap}><Ionicons name="hourglass-outline" size={26} color="#F4F1EA" /></View>
        <Text style={[pa.title, { color: isDark ? '#F3F4F6' : '#101826' }]}>Admin təsdiqi gözlənilir</Text>
        <Text style={[pa.text, { color: isDark ? '#9CA3AF' : '#475569' }]}>Sizin vəzifəniz admin tərəfindən təsdiqləndikdən sonra student panel aktiv olacaq.</Text>
        <Pressable onPress={() => dispatch(logout())} style={pa.logoutBtn}><Text style={pa.logoutText}>Çıxış et</Text></Pressable>
      </View>
    </View>
  );
}

const pa = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 18 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, alignItems: 'center' },
  iconWrap: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#10233F', alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 12, fontSize: 20, fontWeight: '800' },
  text: { marginTop: 8, textAlign: 'center', lineHeight: 20 },
  logoutBtn: { marginTop: 14, borderRadius: 12, backgroundColor: '#B91C1C', paddingVertical: 11, paddingHorizontal: 20 },
  logoutText: { color: '#FFFFFF', fontWeight: '800' },
});
