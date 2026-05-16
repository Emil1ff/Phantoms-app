import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Pressable,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../redux/slices/authSlice';
import { setSelectedPanel } from '../../redux/slices/uiSlice';
import { setLanguage, setTheme, type ThemeMode } from '../../redux/slices/uiSlice';
import { t } from '../../i18n';
import { canSwitchPanels, getSessionRoles, hasPermission, hasSessionRole } from '../../utils/session';
import { ClientProfileTab } from './sections/ClientProfileTab';
import { ClientLostFoundTab } from './sections/ClientLostFoundTab';
import { ClientTeamFinderTab } from './sections/ClientTeamFinderTab';
import { NotificationsModal } from '../../components/common/NotificationsModal';
import { getMyStudentDashboard } from '../../services/students/studentsService';
import type { StudentDashboard } from '../../types/students';
import { ChatTab } from '../../components/common/ChatTab';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientMain'>;
type TabKey = 'home' | 'lost_found' | 'team_finder' | 'messages' | 'profile';
type TabItem = { key: TabKey; label: string; icon: string };

const tabs: Array<TabItem & { permission?: string }> = [
  { key: 'home', label: 'home', icon: 'home-outline' },
  { key: 'lost_found', label: 'lost_found', icon: 'cube-outline' },
  { key: 'team_finder', label: 'team_finder', icon: 'people-outline' },
  { key: 'messages', label: 'messages', icon: 'chatbubbles-outline', permission: 'Permissions.Messages.View' },
  { key: 'profile', label: 'profile', icon: 'person-outline' },
];

export function ClientMainScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lostFoundRefreshing, setLostFoundRefreshing] = useState(false);
  const [teamFinderRefreshing, setTeamFinderRefreshing] = useState(false);
  const [lostFoundRefreshSignal, setLostFoundRefreshSignal] = useState(0);
  const [teamFinderRefreshSignal, setTeamFinderRefreshSignal] = useState(0);
  const [studentDashboard, setStudentDashboard] = useState<StudentDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const sessionRoles = getSessionRoles(session);
  const hasClientRole = hasSessionRole(session, 'Client');
  const hasAdminAccess = canSwitchPanels(session);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const { theme, language } = useAppSelector(state => state.ui);
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const selectedLanguageFlag = language === 'az' ? '🇦🇿' : language === 'ru' ? '🇷🇺' : '🇬🇧';
  const palette = {
    bg: isDark ? '#0B1220' : '#F4F1EA',
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F4F1EA' : '#101826',
    muted: isDark ? '#9CA3AF' : '#596174',
    border: isDark ? '#24344F' : '#D8CFBF',
    primary: '#101826',
    primaryText: '#F4F1EA',
    tabInactive: isDark ? '#94A3B8' : '#6B7280',
  };
  const titleStyle = { color: palette.text };
  const subtitleStyle = { color: palette.muted };
  const rootStyle = { paddingTop: insets.top, backgroundColor: palette.bg };
  const bottomBarStyle = {
    paddingBottom: insets.bottom + 8,
    backgroundColor: palette.bg,
    borderTopColor: palette.border,
  };

  async function loadDashboard() {
    if (!session?.accessToken) return;
    try {
      setDashboardLoading(true);
      const data = await getMyStudentDashboard(session.accessToken);
      setStudentDashboard(data);
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const visibleTabs = tabs.filter(tab => {
    if (!tab.permission) return true;
    return hasPermission(session, tab.permission) || hasClientRole;
  });

  function jumpToTab(index: number) {
    setActiveTab(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, titleStyle]}>Phantoms</Text>
          <Text style={[styles.headerSub, subtitleStyle]}>Hey {session?.fullName ?? 'Client'}</Text>
        </View>
        <View style={styles.headerActionsRow}>
          {hasAdminAccess && sessionRoles.length > 1 ? (
            <Pressable onPress={() => setPanelPickerOpen(true)} style={[styles.headerAction, styles.headerActionDark]}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#F4F1EA" />
            </Pressable>
          ) : null}
          <Pressable onPress={() => setLanguageModalOpen(true)} style={styles.headerAction}>
            <Text style={{ color: '#F4F1EA' }}>{selectedLanguageFlag}</Text>
          </Pressable>
          <Pressable onPress={() => setThemeModalOpen(true)} style={styles.headerAction}>
            <Ionicons name={theme === 'dark' ? 'moon-outline' : theme === 'light' ? 'sunny-outline' : 'phone-portrait-outline'} size={18} color="#F4F1EA" />
          </Pressable>
          <Pressable onPress={() => setNotificationsOpen(true)} style={styles.headerAction}>
            <Ionicons name="notifications-outline" size={18} color="#F4F1EA" />
          </Pressable>
        </View>

        <Modal visible={panelPickerOpen} transparent animationType="fade" onRequestClose={() => setPanelPickerOpen(false)}>
          <Pressable style={styles.panelPickerOverlay} onPress={() => setPanelPickerOpen(false)}>
            <Pressable style={[styles.panelPickerCard, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => {}}>
              <Text style={[styles.panelPickerTitle, { color: palette.text }]}>Choose your role</Text>
              <Text style={[styles.panelPickerSubtitle, { color: palette.muted }]}>Choose which workspace to open.</Text>
              <View style={styles.panelPickerRow}>
                {Array.from(new Set(sessionRoles)).map(roleName => {
                  const isClient = roleName.toLowerCase() === 'client';
                  return (
                    <Pressable
                      key={roleName}
                      onPress={() => { dispatch(setSelectedPanel(isClient ? 'student' : roleName.toLowerCase() === 'teacher' ? 'teacher' : 'admin')); setPanelPickerOpen(false); }}
                      style={[styles.panelPickerButton, { borderColor: palette.border, backgroundColor: palette.card }]}>
                      <Ionicons name={isClient ? 'person-outline' : roleName.toLowerCase() === 'teacher' ? 'school-outline' : 'shield-checkmark-outline'} size={26} color={palette.text} />
                      <Text style={[styles.panelPickerButtonText, { color: palette.text }]}>{roleName}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <Modal visible={languageModalOpen} transparent animationType="fade" onRequestClose={() => setLanguageModalOpen(false)}>
          <Pressable style={styles.centerOverlay} onPress={() => setLanguageModalOpen(false)}>
            <Pressable style={[styles.centerModal, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => {}}>
              <Text style={[styles.panelPickerTitle, { color: palette.text }]}>{t(language, 'language')}</Text>
              <View style={styles.panelPickerRow}>
                {([
                  ['az', 'AZ', '🇦🇿'],
                  ['en', 'EN', '🇬🇧'],
                  ['ru', 'RU', '🇷🇺'],
                ] as const).map(([value, label, flag]) => (
                  <Pressable
                    key={value}
                    onPress={() => dispatch(setLanguage(value))}
                    style={[
                      styles.panelPickerButton,
                      { borderColor: palette.border, backgroundColor: palette.card },
                      language === value && styles.tabBtnActive,
                    ]}>
                    <Text style={{ color: language === value ? palette.primaryText : palette.text }}>{flag} {label}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        <Modal visible={themeModalOpen} transparent animationType="fade" onRequestClose={() => setThemeModalOpen(false)}>
          <Pressable style={styles.centerOverlay} onPress={() => setThemeModalOpen(false)}>
            <Pressable style={[styles.centerModal, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => {}}>
              <Text style={[styles.panelPickerTitle, { color: palette.text }]}>{t(language, 'dark_mode')}</Text>
              <View style={styles.panelPickerRow}>
                {(['system', 'light', 'dark'] as ThemeMode[]).map(item => (
                  <Pressable
                    key={item}
                    onPress={() => dispatch(setTheme(item))}
                    style={[
                      styles.panelPickerButton,
                      { borderColor: palette.border, backgroundColor: palette.card },
                      theme === item && styles.tabBtnActive,
                    ]}>
                    <Text style={{ color: theme === item ? palette.primaryText : palette.text }}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveTab(index);
        }}>
        {visibleTabs.map(tab => {
          if (tab.key === 'home') {
            return (
              <ScrollView
                key={tab.key}
                refreshControl={<RefreshControl refreshing={dashboardLoading} onRefresh={() => void loadDashboard()} />}
                contentContainerStyle={[styles.page, { width, paddingBottom: insets.bottom + 110 }]}>
                <View style={{ marginTop: 10, borderRadius: 18, backgroundColor: isDark ? '#111C31' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#24344F' : '#E2E8F0', padding: 14 }}>
                  <Text style={{ color: isDark ? '#F3F4F6' : '#101826', fontSize: 20, fontWeight: '800' }}>{t(language, 'home')}</Text>
                  <Text style={{ marginTop: 6, color: isDark ? '#9CA3AF' : '#475569' }}>{dashboardLoading ? t(language, 'loading') : t(language, 'student_dashboard_subtitle')}</Text>
                  <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ width: '48%', borderRadius: 12, padding: 10, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}><Text style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>{t(language, 'announcements')}</Text><Text style={{ marginTop: 4, color: isDark ? '#F3F4F6' : '#101826', fontWeight: '800', fontSize: 18 }}>{studentDashboard?.announcementsCount ?? 0}</Text></View>
                    <View style={{ width: '48%', borderRadius: 12, padding: 10, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}><Text style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>{t(language, 'events')}</Text><Text style={{ marginTop: 4, color: isDark ? '#F3F4F6' : '#101826', fontWeight: '800', fontSize: 18 }}>{studentDashboard?.eventsCount ?? 0}</Text></View>
                    <View style={{ width: '48%', borderRadius: 12, padding: 10, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}><Text style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>{t(language, 'lost_found')}</Text><Text style={{ marginTop: 4, color: isDark ? '#F3F4F6' : '#101826', fontWeight: '800', fontSize: 18 }}>{studentDashboard?.lostFoundCount ?? 0}</Text></View>
                    <View style={{ width: '48%', borderRadius: 12, padding: 10, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}><Text style={{ color: isDark ? '#9CA3AF' : '#64748B' }}>{t(language, 'team_finder')}</Text><Text style={{ marginTop: 4, color: isDark ? '#F3F4F6' : '#101826', fontWeight: '800', fontSize: 18 }}>{studentDashboard?.teamFinderCount ?? 0}</Text></View>
                  </View>
                </View>
              </ScrollView>
            );
          }
          if (tab.key === 'lost_found') {
            return (
              <ScrollView
                key={tab.key}
                refreshControl={<RefreshControl refreshing={lostFoundRefreshing} onRefresh={() => {
                  setLostFoundRefreshing(true);
                  setLostFoundRefreshSignal(value => value + 1);
                }} />}
                contentContainerStyle={[styles.page, { width, paddingBottom: insets.bottom + 110 }]}>
                <ClientLostFoundTab refreshSignal={lostFoundRefreshSignal} onRefreshDone={() => setLostFoundRefreshing(false)} />
              </ScrollView>
            );
          }
          if (tab.key === 'team_finder') {
            return (
              <ScrollView
                key={tab.key}
                refreshControl={<RefreshControl refreshing={teamFinderRefreshing} onRefresh={() => {
                  setTeamFinderRefreshing(true);
                  setTeamFinderRefreshSignal(value => value + 1);
                }} />}
                contentContainerStyle={[styles.page, { width, paddingBottom: insets.bottom + 110 }]}>
                <ClientTeamFinderTab refreshSignal={teamFinderRefreshSignal} onRefreshDone={() => setTeamFinderRefreshing(false)} />
              </ScrollView>
            );
          }
          if (tab.key === 'messages') {
            return (
              <ScrollView
                key={tab.key}
                contentContainerStyle={[styles.page, { width, paddingBottom: insets.bottom + 110 }]}>
                <ChatTab token={session?.accessToken ?? ''} currentUserId={session?.userId} isDark={isDark} />
              </ScrollView>
            );
          }
          return <ScrollView key={tab.key} contentContainerStyle={[styles.page, { width, paddingBottom: insets.bottom + 110 }]}><ClientProfileTab session={session} language={language} isDark={isDark} onOpenProfile={() => navigation.navigate('Profile')} onLogout={() => dispatch(logout())} /></ScrollView>;
        })}
      </ScrollView>

      <View style={[styles.bottomBar, bottomBarStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomBarContent}>
          {visibleTabs.map(tab => {
            const index = visibleTabs.findIndex(item => item.key === tab.key);
            const active = index === activeTab;
            return (
              <Pressable key={tab.key} onPress={() => jumpToTab(index)} style={[styles.tabBtn, active && styles.tabBtnActive]}>
                <Ionicons name={tab.icon} size={18} color={active ? palette.primaryText : palette.tabInactive} />
                <Text numberOfLines={1} style={[styles.tabText, { color: active ? palette.primaryText : palette.tabInactive }, active && styles.tabTextActive]}>{t(language, tab.label)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <NotificationsModal visible={notificationsOpen} token={session?.accessToken ?? ''} onClose={() => setNotificationsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1 
  },
  header: { 
    paddingHorizontal: 18,
     paddingBottom: 12, 
     paddingTop: 6, 
     flexDirection: 'row', 
     justifyContent: 'space-between', 
     alignItems: 'center' 
    },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '800' 
  },
  headerSub: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  headerAction: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#101826', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  page: { 
    paddingHorizontal: 18 
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 10, borderTopWidth: 1 },
  bottomBarContent: { paddingHorizontal: 10 },
  tabBtn: { minWidth: 92, marginHorizontal: 4, borderRadius: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  tabBtnActive: { backgroundColor: '#101826' },
  tabText: { marginTop: 4, color: '#6B7280', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#F4F1EA' },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionDark: { backgroundColor: '#10233F' },
  panelPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  panelPickerCard: { width: '86%', borderWidth: 1, borderRadius: 12, padding: 14 },
  centerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  centerModal: { width: '86%', borderWidth: 1, borderRadius: 12, padding: 14 },
  panelPickerTitle: { fontSize: 16, fontWeight: '800' },
  panelPickerSubtitle: { marginTop: 6, color: '#6B7280' },
  panelPickerRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  panelPickerButton: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 10, alignItems: 'center' },
  panelPickerButtonText: { marginTop: 8, fontWeight: '800' },
});
