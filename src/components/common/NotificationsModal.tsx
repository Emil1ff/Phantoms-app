import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { t } from '../../i18n';
import { useAppSelector } from '../../hooks/redux';
import { getMyNotifications, markAllNotificationsRead, markNotificationAsRead } from '../../services/notifications/notificationsService';
import type { NotificationItem } from '../../types/notifications';

type Props = {
  visible: boolean;
  token: string;
  onClose: () => void;
};

export function NotificationsModal({ visible, token, onClose }: Props) {
  const language = useAppSelector(state => state.ui.language);
  const theme = useAppSelector(state => state.ui.theme);
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const palette = {
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F3F4F6' : '#101826',
    muted: isDark ? '#9CA3AF' : '#64748B',
    border: isDark ? '#24344F' : '#E2E8F0',
    surface: isDark ? '#0F172A' : '#F1F5F9',
  };

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getMyNotifications({ page: 1, pageSize: 50, unreadOnly: false }, token);
      setItems(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, token]);

  async function onRead(id: string) {
    if (!token) return;
    await markNotificationAsRead(id, token);
    await load();
  }

  async function onReadAll() {
    if (!token) return;
    await markAllNotificationsRead(token);
    await load();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={nm.overlay} onPress={onClose}>
        <Pressable style={[nm.card, { backgroundColor: palette.card }]} onPress={() => {}}>
          <View style={nm.headerRow}>
            <Text style={[nm.title, { color: palette.text }]}>{t(language, 'notifications')}</Text>
            <View style={nm.headerActions}>
              <Pressable style={[nm.iconBtn, { backgroundColor: palette.surface }]} onPress={onReadAll}><Ionicons name="checkmark-done-outline" size={18} color={palette.text} /></Pressable>
              <Pressable style={[nm.iconBtn, { backgroundColor: palette.surface }]} onPress={onClose}><Ionicons name="close" size={18} color={palette.text} /></Pressable>
            </View>
          </View>

          {loading ? <Text style={[nm.info, { color: palette.muted }]}>{t(language, 'loading')}</Text> : null}
          {error ? <Text style={nm.error}>{error}</Text> : null}

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 6 }}>
            {items.map(item => (
              <Pressable
                key={item.id}
                style={[
                  nm.item,
                  { borderColor: palette.border },
                  !item.isRead && {
                    backgroundColor: isDark ? '#1B2A42' : '#F8FAFC',
                    borderColor: isDark ? '#365072' : '#BFDBFE',
                  },
                ]}
                onPress={() => void onRead(item.id)}>
                <Text style={[nm.msg, { color: palette.text }]}>{item.message}</Text>
                <Text style={[nm.meta, { color: palette.muted }]}>{item.isRead ? t(language, 'read') : t(language, 'unread')}</Text>
              </Pressable>
            ))}
            {!loading && items.length === 0 ? <Text style={[nm.info, { color: palette.muted }]}>{t(language, 'notifications_empty')}</Text> : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const nm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  card: { borderRadius: 16, padding: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  item: { marginTop: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  msg: { fontWeight: '600' },
  meta: { marginTop: 4, fontSize: 12 },
  info: { marginTop: 12 },
  error: { marginTop: 12, color: '#B91C1C', fontWeight: '700' },
});
