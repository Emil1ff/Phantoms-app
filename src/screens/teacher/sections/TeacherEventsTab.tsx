import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { EventItem } from '../../../types/events';

type Props = {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  search: string;
  upcomingOnly: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onSearchChange: (value: string) => void;
  onToggleUpcomingOnly: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDate(value: string) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function TeacherEventsTab({
  events,
  loading,
  error,
  search,
  upcomingOnly,
  canCreate,
  canEdit,
  canDelete,
  onSearchChange,
  onToggleUpcomingOnly,
  onRefresh,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: Props) {
  return (
    <View>
      <View style={sectionStyles.heroCard}>
        <View style={sectionStyles.heroTopRow}>
          <View style={sectionStyles.heroIcon}><Ionicons name="calendar-outline" size={20} color="#F4F1EA" /></View>
          <Pressable onPress={onRefresh} style={sectionStyles.iconButton}>
            <Ionicons name="reload-outline" size={18} color="#101826" />
          </Pressable>
        </View>
        <Text style={sectionStyles.heroTitle}>Events</Text>
        <Text style={sectionStyles.heroSubtitle}>API-dən gələn real event listesi, filter və modal ilə idarə olunur.</Text>
        <View style={sectionStyles.heroStatsRow}>
          <View style={sectionStyles.statPill}><Text style={sectionStyles.statValue}>{events.length}</Text><Text style={sectionStyles.statLabel}>items</Text></View>
          <View style={sectionStyles.statPill}><Text style={sectionStyles.statValue}>{upcomingOnly ? 'On' : 'All'}</Text><Text style={sectionStyles.statLabel}>scope</Text></View>
        </View>
      </View>

      <View style={sectionStyles.surfaceCard}>
        <Text style={sectionStyles.sectionTitle}>Search & filters</Text>
        <View style={sectionStyles.inputCard}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search events"
            placeholderTextColor="#64748B"
            style={sectionStyles.inputText}
          />
        </View>
        <View style={sectionStyles.chipRow}>
          <Pressable onPress={onToggleUpcomingOnly} style={[sectionStyles.chip, upcomingOnly && sectionStyles.chipActive]}>
            <Text style={[sectionStyles.chipText, upcomingOnly && sectionStyles.chipTextActive]}>{upcomingOnly ? 'Upcoming only' : 'All events'}</Text>
          </Pressable>
          {canCreate ? (
          <Pressable onPress={onOpenCreate} style={[sectionStyles.chip, sectionStyles.primaryChip]}>
            <Text style={[sectionStyles.chipText, sectionStyles.primaryChipText]}>New event</Text>
          </Pressable>
          ) : null}
        </View>
        <View style={sectionStyles.chipRow}>
          <Pressable onPress={() => onSearchChange('')} style={sectionStyles.chip}>
            <Text style={sectionStyles.chipText}>Clear search</Text>
          </Pressable>
          <Pressable onPress={onRefresh} style={sectionStyles.chip}>
            <Text style={sectionStyles.chipText}>Reload</Text>
          </Pressable>
        </View>
      </View>

      {loading ? <Text style={sectionStyles.mutedText}>Loading events...</Text> : null}
      {error ? <Text style={sectionStyles.errorText}>{error}</Text> : null}

      <View style={sectionStyles.listGap}>
        {events.map(item => (
          <View key={item.id} style={sectionStyles.listCard}>
            <View style={sectionStyles.listTopRow}>
              <View style={sectionStyles.titleWrap}>
                <Text style={sectionStyles.cardTitle}>{item.title}</Text>
                <Text style={sectionStyles.cardMeta}>{formatDate(item.date)}</Text>
              </View>
              <View style={sectionStyles.dateBadge}>
                <Ionicons name="time-outline" size={14} color="#101826" />
                <Text style={sectionStyles.dateBadgeText}>{formatDate(item.date)}</Text>
              </View>
            </View>

            <Text style={sectionStyles.cardBody} numberOfLines={3}>{item.description}</Text>

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

      {!loading && events.length === 0 ? <Text style={sectionStyles.emptyText}>No events found.</Text> : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#10233F',
    marginTop: 12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#23406E', alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F4F1EA', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { marginTop: 14, color: '#F4F1EA', fontSize: 22, fontWeight: '800' },
  heroSubtitle: { marginTop: 6, color: '#C9D6EB', lineHeight: 20 },
  heroStatsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statPill: { flex: 1, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, alignItems: 'center' },
  statValue: { color: '#F4F1EA', fontSize: 18, fontWeight: '800' },
  statLabel: { marginTop: 2, color: '#C9D6EB', fontSize: 12, fontWeight: '600' },
  surfaceCard: { marginTop: 12, borderRadius: 22, backgroundColor: '#FFFFFF', padding: 16 },
  sectionTitle: { color: '#101826', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  inputCard: { borderRadius: 16, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { color: '#101826', fontWeight: '600', flex: 1, padding: 0 },
  chipRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  primaryChip: { backgroundColor: '#101826', borderColor: '#101826' },
  primaryChipText: { color: '#F4F1EA' },
  disabledChip: { opacity: 0.5 },
  chipText: { color: '#101826', fontWeight: '700' },
  chipActive: { backgroundColor: '#EAE2D4', borderColor: '#EAE2D4' },
  chipTextActive: { color: '#101826' },
  mutedText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
  errorText: { marginTop: 12, color: '#B91C1C', fontWeight: '700' },
  listGap: { marginTop: 12, gap: 12 },
  listCard: { borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  listTopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  titleWrap: { flex: 1 },
  cardTitle: { color: '#101826', fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, color: '#64748B', fontSize: 12, fontWeight: '600' },
  cardBody: { marginTop: 12, color: '#334155', lineHeight: 20 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: '#EAE2D4', paddingHorizontal: 10, paddingVertical: 5 },
  dateBadgeText: { fontSize: 11, fontWeight: '800', color: '#101826' },
  cardActions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#F8FAFC' },
  dangerAction: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  secondaryActionText: { color: '#101826', fontWeight: '800' },
  dangerActionText: { color: '#B91C1C' },
  emptyText: { marginTop: 14, color: '#64748B', fontWeight: '600' },
});