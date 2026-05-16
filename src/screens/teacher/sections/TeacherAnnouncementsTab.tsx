import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { AnnouncementItem } from '../../../types/announcements';

type Props = {
  announcements: AnnouncementItem[];
  loading: boolean;
  error: string | null;
  search: string;
  categoryFilter: string;
  categoryOptions: string[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TeacherAnnouncementsTab({
  announcements,
  loading,
  error,
  search,
  categoryFilter,
  categoryOptions,
  canCreate,
  canEdit,
  canDelete,
  onSearchChange,
  onCategoryFilterChange,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: Props) {
  return (
    <View>
      <View style={sectionStyles.heroCard}>
        <View style={sectionStyles.heroTopRow}>
          <View style={sectionStyles.heroIcon}><Ionicons name="megaphone-outline" size={20} color="#F4F1EA" /></View>
          <Pressable onPress={onRefresh} style={sectionStyles.iconButton}>
            <Ionicons name="reload-outline" size={18} color="#101826" />
          </Pressable>
        </View>
        <Text style={sectionStyles.heroTitle}>Announcements</Text>
        <Text style={sectionStyles.heroSubtitle}>Daha temiz kartlar, filterlər və modal əsaslı yaratma axını.</Text>
        <View style={sectionStyles.heroStatsRow}>
          <View style={sectionStyles.statPill}><Text style={sectionStyles.statValue}>{announcements.length}</Text><Text style={sectionStyles.statLabel}>items</Text></View>
          <View style={sectionStyles.statPill}><Text style={sectionStyles.statValue}>{categoryOptions.length}</Text><Text style={sectionStyles.statLabel}>categories</Text></View>
        </View>
      </View>

      <View style={sectionStyles.surfaceCard}>
        <Text style={sectionStyles.sectionTitle}>Search & filter</Text>
        <View style={sectionStyles.inputCard}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search announcements"
            placeholderTextColor="#64748B"
            style={sectionStyles.inputText}
          />
        </View>
        <View style={sectionStyles.chipRow}>
          <Pressable onPress={() => onSearchChange('')} style={[sectionStyles.chip, !search ? sectionStyles.chipActive : null]}>
            <Text style={[sectionStyles.chipText, !search ? sectionStyles.chipTextActive : null]}>Clear search</Text>
          </Pressable>
          {canCreate ? (
          <Pressable onPress={onOpenCreate} style={[sectionStyles.chip, sectionStyles.primaryChip]}>
            <Text style={[sectionStyles.chipText, sectionStyles.primaryChipText]}>New announcement</Text>
          </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sectionStyles.horizontalChips}>
          {categoryOptions.map(item => {
            const active = categoryFilter === item;
            return (
              <Pressable key={item} onPress={() => onCategoryFilterChange(active ? '' : item)} style={[sectionStyles.filterChip, active && sectionStyles.filterChipActive]}>
                <Text style={[sectionStyles.filterChipText, active && sectionStyles.filterChipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? <Text style={sectionStyles.mutedText}>Loading announcements...</Text> : null}
      {error ? <Text style={sectionStyles.errorText}>{error}</Text> : null}

      <View style={sectionStyles.listGap}>
        {announcements.map(item => (
          <View key={item.id} style={sectionStyles.listCard}>
            <View style={sectionStyles.listTopRow}>
              <View style={sectionStyles.titleWrap}>
                <Text style={sectionStyles.cardTitle}>{item.title}</Text>
                <Text style={sectionStyles.cardMeta}>{item.category || 'General'}</Text>
              </View>
              <View style={[sectionStyles.statusBadge, item.isApproved ? sectionStyles.statusApproved : sectionStyles.statusPending]}>
                <Text style={sectionStyles.statusText}>{item.isApproved ? 'Approved' : 'Pending'}</Text>
              </View>
            </View>

            <Text style={sectionStyles.cardBody} numberOfLines={3}>{item.content}</Text>

            <View style={sectionStyles.cardActions}>
              {canEdit ? (
                <Pressable onPress={() => onOpenEdit(item.id)} style={sectionStyles.secondaryAction}>
                  <Ionicons name="create-outline" size={16} color="#101826" />
                  <Text style={sectionStyles.secondaryActionText}>Edit</Text>
                </Pressable>
              ) : null}
              {canDelete ? (
                <Pressable onPress={() => onDelete(item.id)} style={[sectionStyles.secondaryAction, sectionStyles.dangerAction]}>
                  <Ionicons name="trash-outline" size={16} color="#B91C1C" />
                  <Text style={[sectionStyles.secondaryActionText, sectionStyles.dangerActionText]}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {!loading && announcements.length === 0 ? <Text style={sectionStyles.emptyText}>No announcements yet.</Text> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#101826',
    marginTop: 12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#24344F', alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F4F1EA', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 14, color: '#F4F1EA', fontSize: 22, fontWeight: '800' },
  heroSubtitle: { marginTop: 6, color: '#B8C3D6', lineHeight: 20 },
  heroStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statPill: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, alignItems: 'center' },
  statValue: { color: '#F4F1EA', fontSize: 18, fontWeight: '800' },
  statLabel: { marginTop: 2, color: '#B8C3D6', fontSize: 12, fontWeight: '600' },
  surfaceCard: { marginTop: 12, borderRadius: 22, backgroundColor: '#FFFFFF', padding: 16 },
  sectionTitle: { color: '#101826', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  inputCard: { borderRadius: 16, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { color: '#101826', fontWeight: '600', flex: 1, padding: 0 },
  chipRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingVertical: 11, alignItems: 'center' },
  primaryChip: { backgroundColor: '#101826', borderColor: '#101826' },
  primaryChipText: { color: '#F4F1EA' },
  disabledChip: { opacity: 0.5 },
  chipText: { color: '#101826', fontWeight: '700' },
  chipActive: { backgroundColor: '#101826', borderColor: '#101826' },
  chipTextActive: { color: '#F4F1EA' },
  horizontalChips: { gap: 8, paddingTop: 12 },
  filterChip: { borderRadius: 999, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: '#EAE2D4', borderColor: '#EAE2D4' },
  filterChipText: { color: '#334155', fontWeight: '700' },
  filterChipTextActive: { color: '#101826' },
  mutedText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  errorText: { marginTop: 12, color: '#B91C1C', fontWeight: '700' },
  listGap: { marginTop: 12, gap: 12 },
  listCard: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  listTopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  titleWrap: { flex: 1 },
  cardTitle: { color: '#101826', fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '600' },
  cardBody: { marginTop: 12, color: '#334155', lineHeight: 20 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusApproved: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#334155' },
  cardActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC' },
  dangerAction: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  secondaryActionText: { color: '#101826', fontWeight: '800' },
  dangerActionText: { color: '#B91C1C' },
  emptyText: { marginTop: 14, color: '#64748B', fontWeight: '600' },
});