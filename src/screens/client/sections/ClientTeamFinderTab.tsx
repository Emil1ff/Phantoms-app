import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { t } from '../../../i18n';
import { useAppSelector } from '../../../hooks/redux';
import {
  createTeamFinder,
  deleteTeamFinderById,
  getTeamFinder,
  getTeamFinderById,
  updateTeamFinder,
} from '../../../services/teamFinder/teamFinderService';
import type { TeamFinderItem } from '../../../types/teamFinder';
import { hasPermission } from '../../../utils/session';

type ModalMode = 'create' | 'edit';

export function ClientTeamFinderTab({ refreshSignal = 0, onRefreshDone }: { refreshSignal?: number; onRefreshDone?: () => void }) {
  const session = useAppSelector(state => state.auth.session);
  const language = useAppSelector(state => state.ui.language);
  const theme = useAppSelector(state => state.ui.theme);
  const token = session?.accessToken ?? '';
  const isDark = theme === 'dark';

  const canCreate = hasPermission(session, 'Permissions.TeamFinder.Create');
  const canEdit = hasPermission(session, 'Permissions.TeamFinder.Edit');
  const canDelete = hasPermission(session, 'Permissions.TeamFinder.Delete');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TeamFinderItem[]>([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [title, setTitle] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');

  const palette = {
    hero: isDark ? '#10233F' : '#10233F',
    heroSoft: '#23406E',
    heroText: '#F4F1EA',
    heroMuted: '#CBD5E1',
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F3F4F6' : '#111827',
    muted: isDark ? '#9CA3AF' : '#475569',
    border: isDark ? '#24344F' : '#D1D5DB',
    surface: isDark ? '#0F172A' : '#F8FAFC',
  };

  async function loadTeamFinder() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getTeamFinder({ page: 1, pageSize: 50, search: search || undefined }, token);
      setItems(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Team Finder.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeamFinder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      await loadTeamFinder();
      onRefreshDone?.();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  function openCreateModal() {
    if (!canCreate) return;
    setModalMode('create');
    setEditingId('');
    setTitle('');
    setSkillsNeeded('');
    setModalOpen(true);
  }

  async function openEditModal(id: string) {
    if (!canEdit || !token) return;
    try {
      setSubmitting(true);
      const item = await getTeamFinderById(id, token);
      setModalMode('edit');
      setEditingId(item.id);
      setTitle(item.title);
      setSkillsNeeded(item.skillsNeeded);
      setModalOpen(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to fetch post.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTeamFinder() {
    if (!token) return;
    if (!title.trim() || !skillsNeeded.trim()) {
      Alert.alert('Validation', t(language, 'validation_title_skills_required'));
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await createTeamFinder({ title: title.trim(), skillsNeeded: skillsNeeded.trim() }, token);
      } else {
        await updateTeamFinder(editingId, { title: title.trim(), skillsNeeded: skillsNeeded.trim() }, token);
      }
      setModalOpen(false);
      await loadTeamFinder();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(id: string) {
    if (!token || !canDelete) return;
    Alert.alert(t(language, 'delete_post_title'), t(language, 'delete_confirm'), [
      { text: t(language, 'cancel'), style: 'cancel' },
      { text: t(language, 'delete'), style: 'destructive', onPress: async () => { await deleteTeamFinderById(id, token); await loadTeamFinder(); } },
    ]);
  }

  return (
    <View>
      <View style={[tf.heroCard, { backgroundColor: palette.hero }]}> 
        <View style={tf.heroTopRow}>
          <View style={[tf.heroIcon, { backgroundColor: palette.heroSoft }]}><Ionicons name="people-outline" size={18} color={palette.heroText} /></View>
          <Pressable style={tf.reloadBtn} onPress={loadTeamFinder}><Ionicons name="reload-outline" size={18} color="#101826" /></Pressable>
        </View>
        <Text style={[tf.heroTitle, { color: palette.heroText }]}>{t(language, 'team_finder')}</Text>
        <Text style={[tf.heroSubtitle, { color: palette.heroMuted }]}>{t(language, 'team_finder_subtitle')}</Text>
        <TextInput value={search} onChangeText={setSearch} placeholder={t(language, 'search_by_title_skills')} placeholderTextColor="#64748B" style={[tf.searchInput, { borderColor: '#2A4A78', backgroundColor: '#0D1E37', color: '#F8FAFC' }]} />
        <View style={tf.actionRow}>
          <Pressable style={[tf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={loadTeamFinder}><Text style={[tf.secondaryBtnText, { color: palette.text }]}>{t(language, 'apply')}</Text></Pressable>
          {canCreate ? <Pressable style={tf.primaryBtn} onPress={openCreateModal}><Text style={tf.primaryBtnText}>{t(language, 'new')}</Text></Pressable> : null}
        </View>
      </View>

      {loading ? <Text style={[tf.infoText, { color: palette.muted }]}>{t(language, 'loading')}</Text> : null}
      {error ? <Text style={tf.errorText}>{error}</Text> : null}

      <View style={tf.listWrap}>
        {items.map(item => (
          <View key={item.id} style={[tf.itemCard, { backgroundColor: palette.card, borderColor: palette.border }]}> 
            <Text style={[tf.itemTitle, { color: palette.text }]}>{item.title}</Text>
            <Text style={[tf.itemMeta, { color: palette.muted }]}>{t(language, 'skills_needed')}: {item.skillsNeeded}</Text>
            {(canEdit || canDelete) ? (
              <View style={tf.itemActions}>
                {canEdit ? <Pressable style={[tf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={() => void openEditModal(item.id)}><Text style={[tf.secondaryBtnText, { color: palette.text }]}>{t(language, 'edit')}</Text></Pressable> : null}
                {canDelete ? <Pressable style={[tf.secondaryBtn, tf.deleteBtn]} onPress={() => void removeItem(item.id)}><Text style={[tf.secondaryBtnText, tf.deleteBtnText]}>{t(language, 'delete')}</Text></Pressable> : null}
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {!loading && items.length === 0 ? <Text style={[tf.infoText, { color: palette.muted }]}>{t(language, 'no_team_posts')}</Text> : null}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={tf.modalOverlay} onPress={() => setModalOpen(false)}>
          <Pressable style={[tf.modalCard, { backgroundColor: palette.card }]} onPress={() => {}}>
            <Text style={[tf.modalTitle, { color: palette.text }]}>{modalMode === 'create' ? t(language, 'new_team_post') : t(language, 'edit_team_post')}</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder={t(language, 'title')} placeholderTextColor="#64748B" style={[tf.modalInput, { borderColor: palette.border, color: palette.text }]} />
            <TextInput value={skillsNeeded} onChangeText={setSkillsNeeded} placeholder={t(language, 'skills_needed')} placeholderTextColor="#64748B" style={[tf.modalInput, { borderColor: palette.border, color: palette.text }]} />
            <View style={tf.actionRow}>
              <Pressable style={[tf.secondaryBtn, { borderColor: palette.border, backgroundColor: palette.surface }]} onPress={() => setModalOpen(false)}><Text style={[tf.secondaryBtnText, { color: palette.text }]}>{t(language, 'cancel')}</Text></Pressable>
              <Pressable style={tf.primaryBtn} onPress={() => void submitTeamFinder()}><Text style={tf.primaryBtnText}>{submitting ? t(language, 'saving') : t(language, 'save')}</Text></Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const tf = StyleSheet.create({
  heroCard: { marginTop: 10, borderRadius: 22, padding: 16 },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reloadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F1EA', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 10, fontSize: 20, fontWeight: '800' },
  heroSubtitle: { marginTop: 4, fontSize: 13 },
  searchInput: { marginTop: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  actionRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, borderRadius: 12, backgroundColor: '#101826', alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  primaryBtnText: { color: '#F4F1EA', fontWeight: '800' },
  secondaryBtn: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  secondaryBtnText: { fontWeight: '700' },
  listWrap: { marginTop: 12, gap: 10 },
  itemCard: { borderRadius: 16, borderWidth: 1, padding: 12 },
  itemTitle: { fontWeight: '800' },
  itemMeta: { marginTop: 6 },
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
