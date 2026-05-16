import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../redux/slices/authSlice';
import { t } from '../../i18n';
import { canSwitchPanels, getSessionRoles, hasPermission } from '../../utils/session';
import { setLanguage, setSelectedPanel, setTheme, type ThemeMode } from '../../redux/slices/uiSlice';
import {
  createAnnouncement,
  deleteAnnouncementById,
  getAnnouncementById,
  getTeacherAnnouncements,
  updateAnnouncement,
} from '../../services/announcements/announcementsService';
import {
  createEvent,
  deleteEventById,
  getEventById,
  getTeacherEvents,
  updateEvent,
} from '../../services/events/eventsService';
import type { AnnouncementItem } from '../../types/announcements';
import type { EventItem } from '../../types/events';
import { TeacherAnnouncementsTab } from './sections/TeacherAnnouncementsTab';
import { TeacherEventsTab } from './sections/TeacherEventsTab';
import { TeacherProfileTab } from './sections/TeacherProfileTab';
import { NotificationsModal } from '../../components/common/NotificationsModal';
import { ChatTab } from '../../components/common/ChatTab';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherMain'>;
type TabKey = 'announcements' | 'events' | 'messages' | 'profile';
type TabItem = { key: TabKey; label: string; icon: string; permission?: string };
type ModalMode = 'create' | 'edit';

const tabs: TabItem[] = [
  { key: 'announcements', label: 'announcements', icon: 'megaphone-outline', permission: 'Permissions.Announcements.View' },
  { key: 'events', label: 'events', icon: 'calendar-outline', permission: 'Permissions.Events.View' },
  { key: 'messages', label: 'messages', icon: 'chatbubbles-outline', permission: 'Permissions.Messages.View' },
  { key: 'profile', label: 'profile', icon: 'person-outline' },
];

const emptyAnnouncement = { title: '', content: '', category: 'General' };
const emptyEvent = { title: '', description: '', date: '' };

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value: string) {
  if (!value) return 'Select date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; iso: string; inMonth: boolean }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ day: 0, iso: '', inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    cells.push({ day, iso: toIsoDate(d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, iso: '', inMonth: false });
  }
  return cells;
}

export function TeacherMainScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const { language, theme } = useAppSelector(state => state.ui);
  const sessionRoles = getSessionRoles(session);
  const canPanelSwitch = canSwitchPanels(session);
  const token = session?.accessToken ?? '';
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const visibleTabs = useMemo(() => tabs.filter(tab => !tab.permission || hasPermission(session, tab.permission)), [session]);

  const [activeTab, setActiveTab] = useState<TabKey>('announcements');

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [announcementCategoryFilter, setAnnouncementCategoryFilter] = useState('');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementModalMode, setAnnouncementModalMode] = useState<ModalMode>('create');
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementEditingId, setAnnouncementEditingId] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState(emptyAnnouncement.title);
  const [announcementContent, setAnnouncementContent] = useState(emptyAnnouncement.content);
  const [announcementCategory, setAnnouncementCategory] = useState(emptyAnnouncement.category);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [eventUpcomingOnly, setEventUpcomingOnly] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<ModalMode>('create');
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventEditingId, setEventEditingId] = useState('');
  const [eventTitle, setEventTitle] = useState(emptyEvent.title);
  const [eventDescription, setEventDescription] = useState(emptyEvent.description);
  const [eventDate, setEventDate] = useState(emptyEvent.date);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const canCreateAnnouncement = hasPermission(session, 'Permissions.Announcements.Create');
  const canEditAnnouncement = hasPermission(session, 'Permissions.Announcements.Edit');
  const canDeleteAnnouncement = hasPermission(session, 'Permissions.Announcements.Delete');
  const canCreateEvent = hasPermission(session, 'Permissions.Events.Create');
  const canEditEvent = hasPermission(session, 'Permissions.Events.Edit');
  const canDeleteEvent = hasPermission(session, 'Permissions.Events.Delete');

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(['General']);
    announcements.forEach(item => {
      if (item.category) {
        set.add(item.category);
      }
    });
    return Array.from(set);
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = announcementSearch.trim().toLowerCase();
    const normalizedCategory = announcementCategoryFilter.trim().toLowerCase();

    return announcements.filter(item => {
      const matchesCategory = !normalizedCategory || item.category.toLowerCase().includes(normalizedCategory);
      if (!normalizedSearch) return matchesCategory;
      const searchable = [item.title, item.content, item.category].join(' ').toLowerCase();
      return matchesCategory && searchable.includes(normalizedSearch);
    });
  }, [announcements, announcementCategoryFilter, announcementSearch]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = eventSearch.trim().toLowerCase();
    const now = new Date();

    return events.filter(item => {
      const haystack = [item.title, item.description, item.date].join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
      if (!eventUpcomingOnly) return matchesSearch;

      const parsedDate = new Date(item.date);
      const isUpcoming = !Number.isNaN(parsedDate.getTime()) && parsedDate >= now;
      return matchesSearch && isUpcoming;
    });
  }, [eventSearch, eventUpcomingOnly, events]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarViewDate), [calendarViewDate]);
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const calendarMonthLabel = useMemo(
    () => calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [calendarViewDate],
  );

  const loadAnnouncements = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);
      const result = await getTeacherAnnouncements({ page: 1, pageSize: 50 }, token);
      setAnnouncements(result.items);
    } catch (e) {
      setAnnouncementsError(e instanceof Error ? e.message : 'Failed to load announcements.');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [token]);

  const loadEvents = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setEventsLoading(true);
      setEventsError(null);
      const result = await getTeacherEvents({ page: 1, pageSize: 50 }, token);
      setEvents(result.items);
    } catch (e) {
      setEventsError(e instanceof Error ? e.message : 'Failed to load events.');
    } finally {
      setEventsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!visibleTabs.some(tab => tab.key === activeTab)) {
      setActiveTab(visibleTabs[0]?.key ?? 'profile');
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (activeTab === 'announcements') {
      void loadAnnouncements();
    }
  }, [activeTab, loadAnnouncements]);

  useEffect(() => {
    if (activeTab === 'events') {
      void loadEvents();
    }
  }, [activeTab, loadEvents]);

  function openAnnouncementCreateModal() {
    if (!canCreateAnnouncement) {
      return;
    }

    setAnnouncementModalMode('create');
    setAnnouncementEditingId('');
    setAnnouncementTitle(emptyAnnouncement.title);
    setAnnouncementContent(emptyAnnouncement.content);
    setAnnouncementCategory(emptyAnnouncement.category);
    setAnnouncementModalOpen(true);
  }

  async function openAnnouncementEditModal(id: string) {
    if (!token || !canEditAnnouncement) {
      return;
    }

    try {
      setAnnouncementSubmitting(true);
      const item = await getAnnouncementById(id, token);
      setAnnouncementModalMode('edit');
      setAnnouncementEditingId(item.id);
      setAnnouncementTitle(item.title);
      setAnnouncementContent(item.content);
      setAnnouncementCategory(item.category || 'General');
      setAnnouncementModalOpen(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to fetch announcement details.');
    } finally {
      setAnnouncementSubmitting(false);
    }
  }

  async function submitAnnouncement() {
    if (!token) {
      return;
    }

    if (!announcementTitle.trim() || !announcementContent.trim() || !announcementCategory.trim()) {
      Alert.alert('Validation', 'Title, content and category are required.');
      return;
    }

    try {
      setAnnouncementSubmitting(true);
      if (announcementModalMode === 'create') {
        await createAnnouncement({ title: announcementTitle.trim(), content: announcementContent.trim(), category: announcementCategory.trim() }, token);
      } else {
        await updateAnnouncement(announcementEditingId, { title: announcementTitle.trim(), content: announcementContent.trim(), category: announcementCategory.trim() }, token);
      }

      setAnnouncementModalOpen(false);
      await loadAnnouncements();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Announcement action failed.');
    } finally {
      setAnnouncementSubmitting(false);
    }
  }

  async function confirmDeleteAnnouncement(id: string) {
    if (!token || !canDeleteAnnouncement) {
      return;
    }

    Alert.alert('Delete announcement', 'Are you sure you want to delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setAnnouncementsError(null);
            await deleteAnnouncementById(id, token);
            await loadAnnouncements();
          } catch (e) {
            setAnnouncementsError(e instanceof Error ? e.message : 'Delete failed.');
          }
        },
      },
    ]);
  }

  function openEventCreateModal() {
    if (!canCreateEvent) {
      return;
    }

    setEventModalMode('create');
    setEventEditingId('');
    setEventTitle(emptyEvent.title);
    setEventDescription(emptyEvent.description);
    setEventDate(emptyEvent.date);
    setCalendarViewDate(new Date());
    setDatePickerOpen(false);
    setEventModalOpen(true);
  }

  async function openEventEditModal(id: string) {
    if (!token || !canEditEvent) {
      return;
    }

    try {
      setEventSubmitting(true);
      const item = await getEventById(id, token);
      setEventModalMode('edit');
      setEventEditingId(item.id);
      setEventTitle(item.title);
      setEventDescription(item.description);
      setEventDate(item.date);
      const parsed = new Date(item.date);
      setCalendarViewDate(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
      setDatePickerOpen(false);
      setEventModalOpen(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to fetch event details.');
    } finally {
      setEventSubmitting(false);
    }
  }

  async function submitEvent() {
    if (!token) {
      return;
    }

    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate.trim()) {
      Alert.alert('Validation', 'Title, description and date are required.');
      return;
    }

    try {
      setEventSubmitting(true);
      if (eventModalMode === 'create') {
        await createEvent({ title: eventTitle.trim(), description: eventDescription.trim(), date: eventDate.trim() }, token);
      } else {
        await updateEvent(eventEditingId, { title: eventTitle.trim(), description: eventDescription.trim(), date: eventDate.trim() }, token);
      }

      setEventModalOpen(false);
      setDatePickerOpen(false);
      await loadEvents();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Event action failed.');
    } finally {
      setEventSubmitting(false);
    }
  }

  async function confirmDeleteEvent(id: string) {
    if (!token || !canDeleteEvent) {
      return;
    }

    Alert.alert('Delete event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setEventsError(null);
            await deleteEventById(id, token);
            await loadEvents();
          } catch (e) {
            setEventsError(e instanceof Error ? e.message : 'Delete failed.');
          }
        },
      },
    ]);
  }

  function renderActiveTab() {
    if (activeTab === 'announcements') {
      return (
        <TeacherAnnouncementsTab
          announcements={filteredAnnouncements}
          loading={announcementsLoading}
          error={announcementsError}
          search={announcementSearch}
          categoryFilter={announcementCategoryFilter}
          categoryOptions={categoryOptions}
          canCreate={canCreateAnnouncement}
          canEdit={canEditAnnouncement}
          canDelete={canDeleteAnnouncement}
          onSearchChange={value => setAnnouncementSearch(value)}
          onCategoryFilterChange={value => setAnnouncementCategoryFilter(value)}
          onRefresh={() => void loadAnnouncements()}
          onOpenCreate={openAnnouncementCreateModal}
          onOpenEdit={id => void openAnnouncementEditModal(id)}
          onDelete={id => void confirmDeleteAnnouncement(id)}
        />
      );
    }

    if (activeTab === 'events') {
      return (
        <TeacherEventsTab
          events={filteredEvents}
          loading={eventsLoading}
          error={eventsError}
          search={eventSearch}
          upcomingOnly={eventUpcomingOnly}
          canCreate={canCreateEvent}
          canEdit={canEditEvent}
          canDelete={canDeleteEvent}
          onSearchChange={value => setEventSearch(value)}
          onToggleUpcomingOnly={() => setEventUpcomingOnly(current => !current)}
          onRefresh={() => void loadEvents()}
          onOpenCreate={openEventCreateModal}
          onOpenEdit={id => void openEventEditModal(id)}
          onDelete={id => void confirmDeleteEvent(id)}
        />
      );
    }
    if (activeTab === 'messages') {
      return <ChatTab token={token} currentUserId={session?.userId} isDark={isDark} />;
    }

    return (
      <TeacherProfileTab
        name={session?.fullName}
        email={session?.email}
        canSwitchPanels={canPanelSwitch && sessionRoles.length > 1}
        roleCount={sessionRoles.length}
        onOpenProfile={() => navigation.navigate('Profile')}
        onLogout={() => dispatch(logout())}
        onSwitchPanel={() => dispatch(setSelectedPanel(null))}
      />
    );
  }

  const isRefreshing =
    activeTab === 'announcements' ? announcementsLoading : activeTab === 'events' ? eventsLoading : false;

  const handlePullToRefresh = useCallback(() => {
    if (activeTab === 'announcements') {
      void loadAnnouncements();
      return;
    }
    if (activeTab === 'events') {
      void loadEvents();
    }
  }, [activeTab, loadAnnouncements, loadEvents]);

  const rootStyle = [styles.root, { paddingTop: insets.top, backgroundColor: isDark ? '#0B1220' : '#F4F1EA' }];
  const titleColor = isDark ? '#F4F1EA' : '#101826';
  const subtitleColor = isDark ? '#9CA3AF' : '#596174';
  const bottomBarStyle = {
    paddingBottom: insets.bottom + 8,
    backgroundColor: isDark ? '#0B1220' : '#F4F1EA',
    borderTopColor: isDark ? '#24344F' : '#D8CFBF',
  };
  const inactiveTabColor = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={rootStyle}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: titleColor }]}>Teacher Panel</Text>
          <Text style={[styles.sub, { color: subtitleColor }]}>Salam, {session?.fullName ?? 'Teacher'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canPanelSwitch ? (
            <Pressable onPress={() => dispatch(setSelectedPanel(null))} style={styles.switchBtn}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#F4F1EA" />
            </Pressable>
          ) : null}
          <Pressable onPress={() => setLanguageModalOpen(true)} style={styles.switchBtn}>
            <Text style={{ color: '#F4F1EA' }}>{language === 'az' ? '🇦🇿' : language === 'ru' ? '🇷🇺' : '🇬🇧'}</Text>
          </Pressable>
          <Pressable onPress={() => setThemeModalOpen(true)} style={styles.switchBtn}>
            <Ionicons name={theme === 'dark' ? 'moon-outline' : theme === 'light' ? 'sunny-outline' : 'phone-portrait-outline'} size={18} color="#F4F1EA" />
          </Pressable>
          <Pressable onPress={() => setNotificationsOpen(true)} style={styles.switchBtn}>
            <Ionicons name="notifications-outline" size={18} color="#F4F1EA" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handlePullToRefresh} />}
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 130 }]}>
        {visibleTabs.length === 0 ? (
          <View style={styles.emptyPermissionCard}>
            <Text style={styles.emptyPermissionTitle}>No teacher permissions</Text>
            <Text style={styles.emptyPermissionText}>This account does not have access to announcements or events.</Text>
          </View>
        ) : (
          renderActiveTab()
        )}
      </ScrollView>

      <View style={[styles.bottomBar, bottomBarStyle]}>
        {visibleTabs.map(tab => {
          const active = tab.key === activeTab;
          return (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
              <Ionicons name={tab.icon} size={18} color={active ? '#F4F1EA' : inactiveTabColor} />
              <Text numberOfLines={1} style={[styles.tabText, { color: active ? '#F4F1EA' : inactiveTabColor }, active && styles.tabTextActive]}>{t(language, tab.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={announcementModalOpen} transparent animationType="fade" onRequestClose={() => setAnnouncementModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAnnouncementModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{announcementModalMode === 'create' ? 'New announcement' : 'Edit announcement'}</Text>
                <Text style={styles.modalSubtitle}>Create or update teacher announcements.</Text>
              </View>
              <Pressable onPress={() => setAnnouncementModalOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color="#101826" />
              </Pressable>
            </View>

            <TextInput value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="Title" placeholderTextColor="#6B7280" style={styles.modalInput} />
            <TextInput value={announcementCategory} onChangeText={setAnnouncementCategory} placeholder="Category" placeholderTextColor="#6B7280" style={[styles.modalInput, styles.modalInputGap]} />
            <TextInput value={announcementContent} onChangeText={setAnnouncementContent} placeholder="Content" placeholderTextColor="#6B7280" multiline style={[styles.modalInput, styles.modalTextarea]} />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setAnnouncementModalOpen(false)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitAnnouncement()} style={[styles.primaryBtn, announcementSubmitting && styles.btnDisabled]} disabled={announcementSubmitting}>
                <Text style={styles.primaryBtnText}>{announcementSubmitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={languageModalOpen} transparent animationType="fade" onRequestClose={() => setLanguageModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t(language, 'language')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {([
                ['az', 'AZ', '🇦🇿'],
                ['en', 'EN', '🇬🇧'],
                ['ru', 'RU', '🇷🇺'],
              ] as const).map(([value, label, flag]) => (
                <Pressable key={value} onPress={() => dispatch(setLanguage(value))} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>{flag} {label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={themeModalOpen} transparent animationType="fade" onRequestClose={() => setThemeModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setThemeModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>{t(language, 'dark_mode')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map(item => (
                <Pressable key={item} onPress={() => dispatch(setTheme(item))} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <NotificationsModal visible={notificationsOpen} token={token} onClose={() => setNotificationsOpen(false)} />

      <Modal visible={eventModalOpen} transparent animationType="fade" onRequestClose={() => { setEventModalOpen(false); setDatePickerOpen(false); }}>
        <Pressable style={styles.modalOverlay} onPress={() => { setEventModalOpen(false); setDatePickerOpen(false); }}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{eventModalMode === 'create' ? 'New event' : 'Edit event'}</Text>
                <Text style={styles.modalSubtitle}>Keep event content concise and readable.</Text>
              </View>
              <Pressable onPress={() => { setEventModalOpen(false); setDatePickerOpen(false); }} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color="#101826" />
              </Pressable>
            </View>

            <TextInput value={eventTitle} onChangeText={setEventTitle} placeholder="Title" placeholderTextColor="#6B7280" style={styles.modalInput} />
            <Pressable onPress={() => setDatePickerOpen(true)} style={[styles.modalInput, styles.modalInputGap, styles.datePickerField]}>
              <Ionicons name="calendar-outline" size={16} color="#475569" />
              <Text style={styles.datePickerText}>{formatReadableDate(eventDate)}</Text>
            </Pressable>
            {datePickerOpen ? (
              <View style={styles.inlineCalendarCard}>
                <View style={styles.calendarHeader}>
                  <Pressable onPress={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-back" size={16} color="#101826" />
                  </Pressable>
                  <Text style={styles.calendarTitle}>{calendarMonthLabel}</Text>
                  <Pressable onPress={() => setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} style={styles.calendarNavBtn}>
                    <Ionicons name="chevron-forward" size={16} color="#101826" />
                  </Pressable>
                </View>

                <View style={styles.weekHeaderRow}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(label => (
                    <Text key={label} style={styles.weekHeaderText}>{label}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDays.map((cell, index) => {
                    const selected = Boolean(cell.iso) && cell.iso === eventDate;
                    const isPast = Boolean(cell.iso) && cell.iso < todayIso;
                    const isDisabled = !cell.inMonth || isPast;
                    return (
                      <Pressable
                        key={`${cell.iso}-${index}`}
                        disabled={isDisabled}
                        onPress={() => {
                          setEventDate(cell.iso);
                          setDatePickerOpen(false);
                        }}
                        style={[styles.calendarCell, selected && styles.calendarCellSelected, isDisabled && styles.calendarCellDisabled]}>
                        <Text style={[styles.calendarCellText, selected && styles.calendarCellTextSelected, isDisabled && styles.calendarCellTextDisabled]}>
                          {cell.day || ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
            <TextInput value={eventDescription} onChangeText={setEventDescription} placeholder="Description" placeholderTextColor="#6B7280" multiline style={[styles.modalInput, styles.modalTextarea]} />

            <View style={styles.modalActions}>
              <Pressable onPress={() => { setEventModalOpen(false); setDatePickerOpen(false); }} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitEvent()} style={[styles.primaryBtn, eventSubmitting && styles.btnDisabled]} disabled={eventSubmitting}>
                <Text style={styles.primaryBtnText}>{eventSubmitting ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  switchBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#10233F', alignItems: 'center', justifyContent: 'center' },
  page: { paddingHorizontal: 18 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingTop: 10, borderTopWidth: 1 },
  tabBtn: { flex: 1, minWidth: 0, marginHorizontal: 4, borderRadius: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: '#101826' },
  tabText: { marginTop: 4, color: '#6B7280', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#F4F1EA' },
  emptyPermissionCard: { marginTop: 12, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyPermissionTitle: { fontSize: 18, fontWeight: '800', color: '#101826' },
  emptyPermissionText: { marginTop: 6, color: '#475569', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#101826' },
  modalSubtitle: { marginTop: 4, color: '#64748B', fontWeight: '600' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalInput: { marginTop: 14, borderWidth: 1, borderColor: '#D8E0EA', borderRadius: 16, backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 12, color: '#101826', fontWeight: '600' },
  modalInputGap: { marginTop: 10 },
  modalTextarea: { minHeight: 110, textAlignVertical: 'top' },
  datePickerField: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datePickerText: { color: '#101826', fontWeight: '600' },
  inlineCalendarCard: { marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 10 },
  modalActions: { marginTop: 16, flexDirection: 'row', gap: 10 },
  secondaryBtn: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D8E0EA', backgroundColor: '#F8FAFC', paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#101826', fontWeight: '800' },
  primaryBtn: { flex: 1, borderRadius: 14, backgroundColor: '#101826', paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#F4F1EA', fontWeight: '800' },
  btnDisabled: { opacity: 0.72 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calendarNavBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  calendarTitle: { color: '#101826', fontWeight: '800', fontSize: 16 },
  weekHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  weekHeaderText: { flex: 1, textAlign: 'center', color: '#64748B', fontSize: 12, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  calendarCellSelected: { backgroundColor: '#101826' },
  calendarCellDisabled: { opacity: 0.3 },
  calendarCellText: { color: '#0F172A', fontWeight: '600' },
  calendarCellTextSelected: { color: '#F4F1EA', fontWeight: '800' },
  calendarCellTextDisabled: { color: '#94A3B8' },
});
