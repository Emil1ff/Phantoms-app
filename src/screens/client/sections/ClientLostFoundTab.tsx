import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { t } from '../../../i18n';
import { useAppSelector } from '../../../hooks/redux';
import {
  createLostFound,
  deleteLostFoundById,
  getLostFound,
  getLostFoundById,
  updateLostFound,
} from '../../../services/lostFound/lostFoundService';
import type { LostFoundItem } from '../../../types/lostFound';
import { hasPermission } from '../../../utils/session';

type ModalMode = 'create' | 'edit';

export function ClientLostFoundTab({ refreshSignal = 0, onRefreshDone }: { refreshSignal?: number; onRefreshDone?: () => void }) {
  const session = useAppSelector(state => state.auth.session);
  const language = useAppSelector(state => state.ui.language);
  const theme = useAppSelector(state => state.ui.theme);
  const token = session?.accessToken ?? '';
  const isDark = theme === 'dark';

  const canCreate = hasPermission(session, 'Permissions.LostFound.Create');
  const canEdit = hasPermission(session, 'Permissions.LostFound.Edit');
  const canDelete = hasPermission(session, 'Permissions.LostFound.Delete');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'Lost' | 'Found'>('Lost');

  const statuses = useMemo(() => ['Lost', 'Found'], []);
  const palette = {
    hero: isDark ? '#10233F' : '#101826',
    heroSoft: isDark ? '#23406E' : '#24344F',
    heroText: '#F4F1EA',
    heroMuted: '#CBD5E1',
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F3F4F6' : '#111827',
    muted: isDark ? '#9CA3AF' : '#475569',
    border: isDark ? '#24344F' : '#D1D5DB',
    surface: isDark ? '#0F172A' : '#F8FAFC',
  };

  async function loadLostFound() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getLostFound({ page: 1, pageSize: 50, status: statusFilter || undefined, search: search || undefined }, token);
      setItems(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Lost & Found.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLostFound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      await loadLostFound();
      onRefreshDone?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  function openCreateModal() {
    if (!canCreate) return;
    setModalMode('create');
    setEditingId('');
    setTitle('');
    setContact('');
    setStatus('Lost');
    setModalOpen(true);
  }

  async function openEditModal(id: string) {
    if (!canEdit || !token) return;
    try {
      setSubmitting(true);
      const item = await getLostFoundById(id, token);
      setModalMode('edit');
      setEditingId(item.id);
      setTitle(item.title);
      setContact(item.contact);
      setStatus((item.status === 'Found' ? 'Found' : 'Lost') as 'Lost' | 'Found');
      setModalOpen(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to fetch item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitLostFound() {
    if (!token) return;
    if (!title.trim() || !contact.trim()) {
      Alert.alert('Validation', t(language, 'validation_title_contact_required'));
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await createLostFound({ title: title.trim(), contact: contact.trim(), status }, token);
      } else {
        await updateLostFound(editingId, { title: title.trim(), contact: contact.trim(), status }, token);
      }
      setModalOpen(false);
      await loadLostFound();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(id: string) {
    if (!token || !canDelete) return;
    Alert.alert(t(language, 'delete_item_title'), t(language, 'delete_confirm'), [
      { text: t(language, 'cancel'), style: 'cancel' },
      { text: t(language, 'delete'), style: 'destructive', onPress: async () => { await deleteLostFoundById(id, token); await loadLostFound(); } },
    ]);
  }

  return (
    <View>
      <View style={[lf.heroCard, { backgroundColor: palette.hero }]}> 
        <View style={lf.heroTopRow}>
          <View style={[lf.heroIcon, { backgroundColor: palette.heroSoft }]}><Ionicons name="search-outline" size={18} color={palette.heroText} /></View>
          <Pressable style={lf.reloadBtn} onPress={loadLostFound}><Ionicons name="reload-outline" size={18} color="#101826" /></Pressable>
        </View>
        <Text style={[lf.heroTitle, { color: palette.heroText }]}>{t(language, 'lost_found')}</Text>
        <Text style={[lf.heroSubtitle, { color: palette.heroMuted }]}>{t(language, 'lost_found_subtitle')}</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder={t(language, 'search_by_title_contact')} placeholderTextColor="#64748B" style={[lf.searchInput, { borderColor: palette.heroSoft, backgroundColor: isDark ? '#0D1E37' : '#0F1B30', color: '#F8FAFC' }]} />
        <View style={lf.chipRow}>
          <Pressable onPress={() => setStatusFilter('')} style={[lf.chip, !statusFilter && lf.chipActive, { borderColor: palette.border, backgroundColor: palette.card }]}><Text style={[lf.chipText, { color: palette.text }, !statusFilter && lf.chipTextActive]}>{t(language, 'all')}</Text></Pressable>
          {statuses.map(item => (
            <Pressable key={item} onPress={() => setStatusFilter(item)} style={[lf.chip, statusFilter === item && lf.chipActive, { borderColor: palette.border, backgroundColor: palette.card }]}><Text style={[lf.chipText, { color: palette.text }, statusFilter === item && lf.chipTextActive]}>{item}</Text></Pressable>
          ))}
        </View>
        <View style={lf.actionRow}>
          <Pressable style={[lf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={loadLostFound}><Text style={[lf.secondaryBtnText, { color: palette.text }]}>{t(language, 'apply')}</Text></Pressable>
          {canCreate ? <Pressable style={lf.primaryBtn} onPress={openCreateModal}><Text style={lf.primaryBtnText}>{t(language, 'new')}</Text></Pressable> : null}
        </View>
      </View>

      {loading ? <Text style={[lf.infoText, { color: palette.muted }]}>{t(language, 'loading')}</Text> : null}
      {error ? <Text style={lf.errorText}>{error}</Text> : null}

      <View style={lf.listWrap}>
        {items.map(item => (
          <View key={item.id} style={[lf.itemCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <View style={lf.itemTopRow}>
              <Text style={[lf.itemTitle, { color: palette.text }]}>{item.title}</Text>
              <View style={[lf.statusBadge, item.status.toLowerCase() === 'found' ? lf.badgeFound : lf.badgeLost]}><Text style={lf.statusText}>{item.status}</Text></View>
            </View>
            <Text style={[lf.itemMeta, { color: palette.muted }]}>{item.contact}</Text>
            {(canEdit || canDelete) ? (
              <View style={lf.itemActions}>
                {canEdit ? <Pressable style={[lf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={() => void openEditModal(item.id)}><Text style={[lf.secondaryBtnText, { color: palette.text }]}>{t(language, 'edit')}</Text></Pressable> : null}
                {canDelete ? <Pressable style={[lf.secondaryBtn, lf.deleteBtn]} onPress={() => void removeItem(item.id)}><Text style={[lf.secondaryBtnText, lf.deleteBtnText]}>{t(language, 'delete')}</Text></Pressable> : null}
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {!loading && items.length === 0 ? <Text style={[lf.infoText, { color: palette.muted }]}>{t(language, 'no_items')}</Text> : null}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={lf.modalOverlay} onPress={() => setModalOpen(false)}>
          <Pressable style={[lf.modalCard, { backgroundColor: palette.card }]} onPress={() => {}}>
            <Text style={[lf.modalTitle, { color: palette.text }]}>{modalMode === 'create' ? t(language, 'new_lost_found') : t(language, 'edit_lost_found')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t(language, 'title')} placeholderTextColor="#64748B" style={[lf.modalInput, { borderColor: palette.border, color: palette.text }]} />
            <TextInput value={contact} onChangeText={setContact} placeholder={t(language, 'contact')} placeholderTextColor="#64748B" style={[lf.modalInput, { borderColor: palette.border, color: palette.text }]} />
            <View style={lf.chipRow}>
              {statuses.map(item => (
                <Pressable key={item} onPress={() => setStatus(item as 'Lost' | 'Found')} style={[lf.chip, status === item && lf.chipActive, { borderColor: palette.border, backgroundColor: palette.card }]}><Text style={[lf.chipText, { color: palette.text }, status === item && lf.chipTextActive]}>{item}</Text></Pressable>
              ))}
            </View>
            <View style={lf.actionRow}>
              <Pressable style={[lf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={() => setModalOpen(false)}><Text style={[lf.secondaryBtnText, { color: palette.text }]}>{t(language, 'cancel')}</Text></Pressable>
              <Pressable style={lf.primaryBtn} onPress={() => void submitLostFound()}><Text style={lf.primaryBtnText}>{submitting ? t(language, 'saving') : t(language, 'save')}</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const lf = StyleSheet.create({
  heroCard: { marginTop: 10, borderRadius: 22, padding: 16 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F1EA', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 10, fontSize: 20, fontWeight: '800' },
  heroSubtitle: { marginTop: 4, fontSize: 13 },
  searchInput: { marginTop: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  chipRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#101826', borderColor: '#101826' },
  chipText: { fontWeight: '700' },
  chipTextActive: { color: '#F4F1EA' },
  actionRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, borderRadius: 12, backgroundColor: '#101826', alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  primaryBtnText: { color: '#F4F1EA', fontWeight: '800' },
  secondaryBtn: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  secondaryBtnText: { fontWeight: '700' },
  listWrap: { marginTop: 12, gap: 10 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  itemTitle: { fontWeight: '800', flex: 1 },
  itemMeta: { marginTop: 6 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeLost: { backgroundColor: '#FEE2E2' },
  badgeFound: { backgroundColor: '#DCFCE7' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#334155' },
  itemActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  deleteBtnText: { color: '#B91C1C' },
  infoText: { marginTop: 12, fontWeight: '600' },
  errorText: { marginTop: 12, color: '#B91C1C', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 18 },
  modalCard: { borderRadius: 18, padding: 14 },
  modalTitle: { fontWeight: '800', fontSize: 17 },
  modalInput: { marginTop: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
});
