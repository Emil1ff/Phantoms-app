import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import type { PagedProducts, Product } from '../../types/products';
import type { AdminAnnouncement, AdminDashboardStats, AdminUser } from '../../types/admin';
import type { Role } from '../../types/roles';
import { fetchRoles } from '../../redux/slices/rolesSlice';
import {
  approveAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  getAdminDashboard,
} from '../../services/admin/adminService';
import {
  assignUserRole,
  deleteUserThunk,
  fetchAdminUsers,
  removeUserRole,
  toggleUserActiveThunk,
} from '../../redux/slices/usersSlice';
import { getProducts } from '../../services/products/productsService';
import { t } from '../../i18n';
import { setSelectedPanel } from '../../redux/slices/uiSlice';
import { setLanguage, setTheme, type ThemeMode } from '../../redux/slices/uiSlice';
import { canSwitchPanels, getSessionRoles, hasPermission } from '../../utils/session';
import { AdminOverviewTab } from './sections/AdminOverviewTab';
// import { AdminProductsTab } from './sections/AdminProductsTab';
import { AdminUsersTab } from './sections/AdminUsersTab';
import { AdminRolesTab } from './sections/AdminRolesTab';
import { AdminAnnouncementsTab } from './sections/AdminAnnouncementsTab';
import { NotificationsModal } from '../../components/common/NotificationsModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;
type TabKey = 'overview' | 'products' | 'users' | 'announcements' | 'roles';
type UserFilter = 'all' | 'active' | 'inactive';

const tabs: Array<{ key: TabKey; label: string; icon: string; permission?: string }> = [
  { key: 'overview', label: 'overview', icon: 'grid-outline' },
  // { key: 'products', label: 'products', icon: 'cube-outline', permission: 'Permissions.Products.View' },
  { key: 'users', label: 'users', icon: 'people-outline', permission: 'Permissions.Users.View' },
  { key: 'announcements', label: 'announcements', icon: 'megaphone-outline', permission: 'Permissions.Announcements.View' },
  { key: 'roles', label: 'roles', icon: 'shield-checkmark-outline', permission: 'Permissions.Roles.View' },
];

function isSuperAdmin(user: AdminUser) {
  const email = user.email.toLowerCase();
  const username = user.userName.toLowerCase();
  return email === 'admin@phantoms.com' || username === 'admin';
}

function extractProductPage(data: PagedProducts | Product[], requestedPage: number, pageSize: number) {
  const items = Array.isArray(data) ? data : data.items ?? [];
  const totalCount = Array.isArray(data) ? items.length : data.totalCount ?? items.length;
  const pagedData = data as PagedProducts & { hasNextPage?: boolean };
  const totalPages = Array.isArray(data) ? Math.max(1, Math.ceil(items.length / pageSize)) : pagedData.totalPages ?? 1;
  const hasNextPage = Array.isArray(data)
    ? items.length === pageSize
    : Boolean(pagedData.hasNextPage ?? requestedPage < totalPages);

  return { items, totalCount, hasNextPage };
}

export function AdminMainScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView | null>(null);
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const sessionRoles = getSessionRoles(session);
  const hasAdminAccess = canSwitchPanels(session);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const token = session?.accessToken ?? '';
  const { theme, language } = useAppSelector(state => state.ui);
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const palette = {
    bg: isDark ? '#0B1220' : '#F4F1EA',
    card: isDark ? '#111C31' : '#FFFFFF',
    text: isDark ? '#F3F4F6' : '#0F172A',
    muted: isDark ? '#9CA3AF' : '#475569',
    border: isDark ? '#24344F' : '#D1D5DB',
    primary: isDark ? '#D4B483' : '#101826',
    primaryText: isDark ? '#111827' : '#F4F1EA',
  };

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsPageSize = 10;
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productsTotalCount, setProductsTotalCount] = useState(0);
  const [productsNextPage, setProductsNextPage] = useState(1);
  const [productsHasNextPage, setProductsHasNextPage] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsRefreshing, setProductsRefreshing] = useState(false);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);

  const users = useAppSelector(state => state.users.list) as AdminUser[];
  const roles = useAppSelector(state => state.roles.list) as Role[];
  const availableRoleNames = Array.from(
    new Set(
      roles.length > 0
        ? roles.map(role => role.name).filter(Boolean)
        : users.flatMap(user => user.roles).filter(Boolean),
    ),
  );

  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [pendingUserAction, setPendingUserAction] = useState<'assign' | 'remove' | null>(null);
  const [userQuery, setUserQuery] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const rolePickerOptions = useMemo(() => {
    if (!activeUser) {
      return [] as string[];
    }

    const sourceRoles = pendingUserAction === 'remove' ? activeUser.roles : availableRoleNames;

    return Array.from(new Set(sourceRoles.filter(Boolean))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [activeUser, availableRoleNames, pendingUserAction]);

  const productsDisplayCount = productsTotalCount || adminProducts.length;
  const visibleTabs = useMemo(
    () => tabs.filter(tab => !tab.permission || hasPermission(session, tab.permission)),
    [session],
  );
  const canEditUsers = hasPermission(session, 'Permissions.Users.Edit');
  const canDeleteUsers = hasPermission(session, 'Permissions.Users.Delete');
  const canManageRoles = hasPermission(session, 'Permissions.Roles.Manage');
  const canApproveAnnouncements = hasPermission(session, 'Permissions.Announcements.Approve');
  const canDeleteAnnouncements = hasPermission(session, 'Permissions.Announcements.Delete');
  const overviewUsersCount = dashboardStats?.usersCount ?? users.length;
  const overviewRolesCount = roles.length;

  const loadAll = useCallback(async (silent = false) => {
    if (!token) {
      return;
    }
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setProductsLoading(true);
      await Promise.all([
        dispatch(fetchAdminUsers()).unwrap(),
        dispatch(fetchRoles()).unwrap(),
        (async () => {
          setAnnouncementsLoading(true);
          setAnnouncementsError(null);
          try {
            const result = await getAdminAnnouncements(token, { page: 1, pageSize: 30 });
            setAnnouncements(result.items);
          } catch (e) {
            setAnnouncementsError(e instanceof Error ? e.message : 'Failed to load announcements.');
          } finally {
            setAnnouncementsLoading(false);
          }
        })(),
        (async () => {
          try {
            const stats = await getAdminDashboard(token);
            setDashboardStats(stats);
          } catch {
            setDashboardStats(null);
          }
        })(),
        (async () => {
          setProductsError(null);
          setProductsRefreshing(true);
          try {
            const response = await getProducts({ page: 1, pageSize: productsPageSize });
            const normalized = extractProductPage(response, 1, productsPageSize);
            setAdminProducts(normalized.items);
            setProductsTotalCount(normalized.totalCount);
            setProductsHasNextPage(normalized.hasNextPage);
            setProductsNextPage(2);
          } finally {
            setProductsLoading(false);
            setProductsRefreshing(false);
            setProductsLoadingMore(false);
          }
        })(),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function jumpTo(index: number) {
    setActiveTab(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  }
  const selectedLanguageFlag = language === 'az' ? '🇦🇿' : language === 'ru' ? '🇷🇺' : '🇬🇧';

  async function withReload(action: () => Promise<void>) {
    try {
      setError(null);
      await action();
      await loadAll(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    }
  }

  async function refreshAnnouncements() {
    if (!token) return;
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError(null);
      const result = await getAdminAnnouncements(token, { page: 1, pageSize: 30 });
      setAnnouncements(result.items);
    } catch (e) {
      setAnnouncementsError(e instanceof Error ? e.message : 'Failed to load announcements.');
    } finally {
      setAnnouncementsLoading(false);
    }
  }

  async function handleApproveAnnouncement(id: string) {
    if (!token) return;
    await withReload(async () => {
      await approveAnnouncement(id, token);
    });
  }

  async function handleDeleteAnnouncement(id: string) {
    if (!token) return;
    await withReload(async () => {
      await deleteAnnouncement(id, token);
    });
  }

  function openUserMenu(user: AdminUser) {
    setActiveUser(user);
    setUserMenuOpen(true);
  }

  function closeUserMenu() {
    setUserMenuOpen(false);
  }

  function openRolePicker(action: 'assign' | 'remove') {
    setPendingUserAction(action);
    setRolePickerOpen(true);
    setUserMenuOpen(false);
  }

  function closeRolePicker() {
    setRolePickerOpen(false);
    setPendingUserAction(null);
  }

  async function runRoleAction(roleName: string) {
    if (!activeUser?.userId || !pendingUserAction) {
      throw new Error('User context is missing.');
    }

    if (pendingUserAction === 'assign') {
      await dispatch(assignUserRole({ userId: activeUser.userId, roleName })).unwrap();
    } else {
      await dispatch(removeUserRole({ userId: activeUser.userId, roleName })).unwrap();
    }
  }

  async function runUserAction(action: 'toggle' | 'delete') {
    if (!activeUser?.userId) {
      throw new Error('User ID is missing for this record.');
    }

    if (action === 'toggle') {
      await dispatch(toggleUserActiveThunk(activeUser.userId)).unwrap();
      return;
    }

    await dispatch(deleteUserThunk(activeUser.userId)).unwrap();
  }

  const loadMoreProducts = useCallback(async () => {
    if (!token || !productsHasNextPage || productsLoadingMore || productsLoading || productsRefreshing) {
      return;
    }

    try {
      setProductsLoadingMore(true);
      setProductsError(null);
      const response = await getProducts({ page: productsNextPage, pageSize: productsPageSize });
      const normalized = extractProductPage(response, productsNextPage, productsPageSize);
      setAdminProducts(current => {
        const seen = new Set(current.map(product => product.id));
        const nextItems = normalized.items.filter(product => !seen.has(product.id));
        return [...current, ...nextItems];
      });
      setProductsTotalCount(normalized.totalCount);
      setProductsHasNextPage(normalized.hasNextPage);
      setProductsNextPage(productsNextPage + 1);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : 'Failed to load products.');
    } finally {
      setProductsLoadingMore(false);
    }
  }, [token, productsHasNextPage, productsLoadingMore, productsLoading, productsRefreshing, productsNextPage, productsPageSize]);

  const refreshProducts = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setProductsRefreshing(true);
      setProductsError(null);
      const response = await getProducts({ page: 1, pageSize: productsPageSize });
      const normalized = extractProductPage(response, 1, productsPageSize);
      setAdminProducts(normalized.items);
      setProductsTotalCount(normalized.totalCount);
      setProductsHasNextPage(normalized.hasNextPage);
      setProductsNextPage(2);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : 'Failed to load products.');
    } finally {
      setProductsRefreshing(false);
    }
  }, [token, productsPageSize]);

  const headerRowStyle: ViewStyle = { flexDirection: 'row', gap: 8 };
  const rootStyle = { paddingTop: insets.top, backgroundColor: palette.bg };
  const titleStyle = { color: palette.text };
  const subtitleStyle = { color: palette.muted };
  const headerActionStyle = { backgroundColor: palette.primary };
  const headerActionTextStyle = { color: palette.primaryText };
  const pageContentStyle = { width, paddingBottom: insets.bottom + 120 };
  const cardStyle = { backgroundColor: palette.card };
  const chartBgStyle = { backgroundColor: isDark ? '#1B2A42' : '#E5E7EB' };
  const progressBarStyle = (count: number): ViewStyle => ({
    width: `${Math.min(count, 100)}%` as ViewStyle['width'],
  });
  const listItemStyle = { backgroundColor: palette.card, borderColor: palette.border };
  const listFlexStyle = { flex: 1 };
  const statCardStyle = { backgroundColor: palette.card, borderColor: palette.border };
  const activePillStyle = { backgroundColor: '#DCFCE7' };
  const inactivePillStyle = { backgroundColor: '#FEE2E2' };
  const activePillTextStyle = { color: '#166534' };
  const inactivePillTextStyle = { color: '#991B1B' };
  const activeTabStyle = { backgroundColor: palette.primary };
  const activeTabTextStyle = { color: palette.primaryText };
  const inactiveTabTextStyle = { color: palette.muted };
  const bottomBarStyle = {
    paddingBottom: insets.bottom + 8,
    borderTopColor: palette.border,
    backgroundColor: palette.bg,
  };
  const modalBackdropStyle = { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.35)' };
  const modalCardStyle = { backgroundColor: palette.card, borderColor: palette.border };
  const modalTitleStyle = { color: palette.text };
  const modalSecondaryTextStyle = { color: palette.muted };
  const actionMenuItemStyle = { borderColor: palette.border };
  const actionMenuDangerStyle = { backgroundColor: '#FEE2E2', borderColor: '#FECACA' };
  const actionMenuDangerTextStyle = { color: '#991B1B' };
  const userMenuButtonStyle = {
    borderColor: palette.border,
    backgroundColor: isDark ? '#182338' : '#F8FAFC',
  };
  const searchInputSurfaceStyle = {
    borderColor: palette.border,
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
  };
  const roleChipSurfaceStyle = {
    borderColor: palette.border,
    backgroundColor: isDark ? '#182338' : '#F8FAFC',
  };
  const avatarStyle = { backgroundColor: isDark ? '#24344F' : '#E2E8F0' };

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} />
  );

  return (
    <View style={[styles.root, rootStyle]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, titleStyle]}>{t(language, 'admin_console')}</Text>
          <Text style={[styles.subtitle, subtitleStyle]}>{session?.fullName ?? 'Admin'}</Text>
        </View>
        <View style={headerRowStyle}>
          {hasAdminAccess && sessionRoles.length > 1 ? (
            <Pressable onPress={() => setPanelPickerOpen(true)} style={[styles.headerBtn, headerActionStyle]}>
              <Ionicons name="swap-horizontal-outline" size={20} color={palette.primaryText} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => navigation.navigate('Profile')} style={[styles.headerBtn, headerActionStyle]}>
            <Ionicons name="person-circle-outline" size={20} color={palette.primaryText} />
          </Pressable>
          <Pressable onPress={() => setLanguageModalOpen(true)} style={[styles.headerBtn, headerActionStyle]}>
            <Text style={{ color: palette.primaryText, fontSize: 15 }}>{selectedLanguageFlag}</Text>
          </Pressable>
          <Pressable onPress={() => setThemeModalOpen(true)} style={[styles.headerBtn, headerActionStyle]}>
            <Ionicons name={theme === 'dark' ? 'moon-outline' : theme === 'light' ? 'sunny-outline' : 'phone-portrait-outline'} size={18} color={palette.primaryText} />
          </Pressable>
          <Pressable onPress={() => setNotificationsOpen(true)} style={[styles.headerBtn, headerActionStyle]}>
            <Ionicons name="notifications-outline" size={18} color={palette.primaryText} />
          </Pressable>
        </View>

        <Modal visible={panelPickerOpen} transparent animationType="fade" onRequestClose={() => setPanelPickerOpen(false)}>
          <Pressable style={styles.panelPickerOverlay} onPress={() => setPanelPickerOpen(false)}>
            <Pressable style={[styles.panelPickerCard, { backgroundColor: palette.card, borderColor: palette.border }]} onPress={() => {}}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Choose your role</Text>
              <Text style={[styles.modalSubtitle, { color: palette.muted }]}>Choose workspace for this session.</Text>
              <View style={styles.panelPickerRow}>
                {Array.from(new Set(sessionRoles)).map(roleName => {
                  const normalizedRole = roleName.toLowerCase();
                  const selected = normalizedRole === 'client' || normalizedRole === 'student'
                    ? 'student'
                    : normalizedRole === 'teacher'
                      ? 'teacher'
                      : 'admin';
                  return (
                    <Pressable
                      key={roleName}
                      onPress={() => { dispatch(setSelectedPanel(selected)); setPanelPickerOpen(false); }}
                      style={[styles.panelPickerButton, { borderColor: palette.border }]}>
                      <Ionicons name={selected === 'student' ? 'person-outline' : selected === 'teacher' ? 'school-outline' : 'shield-checkmark-outline'} size={26} color={palette.text} />
                      <Text style={[styles.panelPickerButtonText, { color: palette.text }]}>{roleName}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
      <Modal visible={languageModalOpen} transparent animationType="fade" onRequestClose={() => setLanguageModalOpen(false)}>
        <Pressable style={styles.centerOverlay} onPress={() => setLanguageModalOpen(false)}>
          <Pressable style={[styles.centerModal, modalCardStyle]} onPress={() => {}}>
            <Text style={[styles.modalTitle, modalTitleStyle]}>{t(language, 'language')}</Text>
            <View style={styles.filterRow}>
              {([
                ['az', 'AZ', '🇦🇿'],
                ['en', 'EN', '🇬🇧'],
                ['ru', 'RU', '🇷🇺'],
              ] as const).map(([value, label, flag]) => (
                <Pressable
                  key={value}
                  onPress={() => dispatch(setLanguage(value))}
                  style={[styles.filterChip, { borderColor: palette.border }, language === value && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
                  <Text style={[styles.filterChipText, language === value ? headerActionTextStyle : titleStyle]}>{flag} {label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <NotificationsModal visible={notificationsOpen} token={token} onClose={() => setNotificationsOpen(false)} />
      <Modal visible={themeModalOpen} transparent animationType="fade" onRequestClose={() => setThemeModalOpen(false)}>
        <Pressable style={styles.centerOverlay} onPress={() => setThemeModalOpen(false)}>
          <Pressable style={[styles.centerModal, modalCardStyle]} onPress={() => {}}>
            <Text style={[styles.modalTitle, modalTitleStyle]}>{t(language, 'dark_mode')}</Text>
            <View style={styles.filterRow}>
              {(['system', 'light', 'dark'] as ThemeMode[]).map(item => (
                <Pressable
                  key={item}
                  onPress={() => dispatch(setTheme(item))}
                  style={[styles.filterChip, { borderColor: palette.border }, theme === item && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
                  <Text style={[styles.filterChipText, theme === item ? headerActionTextStyle : titleStyle]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {loading ? <ActivityIndicator style={styles.loader} color="#10233F" /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          setActiveTab(Math.round(event.nativeEvent.contentOffset.x / width));
        }}>
        {visibleTabs.map(tab => {
          if (tab.key === 'overview') {
            return (
              <ScrollView key={tab.key} refreshControl={refreshControl} contentContainerStyle={[styles.page, pageContentStyle]}>
                <AdminOverviewTab styles={styles} cardStyle={cardStyle} titleStyle={titleStyle} subtitleStyle={subtitleStyle} chartBgStyle={chartBgStyle} progressBarStyle={progressBarStyle} productsDisplayCount={productsDisplayCount} usersCount={overviewUsersCount} rolesCount={overviewRolesCount} headerActionStyle={headerActionStyle} headerActionTextStyle={headerActionTextStyle} onReload={() => loadAll(true)} language={language} />
              </ScrollView>
            );
          }
          // if (tab.key === 'products') {
          //   return <AdminProductsTab key={tab.key} styles={styles} data={adminProducts} pageContentStyle={pageContentStyle} cardStyle={cardStyle} titleStyle={titleStyle} subtitleStyle={subtitleStyle} roleChipSurfaceStyle={roleChipSurfaceStyle} headerActionStyle={headerActionStyle} headerActionTextStyle={headerActionTextStyle} canCreateProduct={canCreateProduct} canUpdateProduct={canUpdateProduct} productsLoading={productsLoading} productsRefreshing={productsRefreshing} productsLoadingMore={productsLoadingMore} productsHasNextPage={productsHasNextPage} productsError={productsError} productsDisplayCount={productsDisplayCount} onRefresh={refreshProducts} onLoadMore={loadMoreProducts} onOpenDetails={id => navigation.navigate('AdminProductDetails', { productId: id })} onOpenEditorCreate={() => navigation.navigate('AdminProductEditor', { mode: 'create' })} onOpenEditorEdit={id => navigation.navigate('AdminProductEditor', { mode: 'edit', productId: id })} language={language} />;
          // }
          if (tab.key === 'users') {
            return (
              <ScrollView key={tab.key} refreshControl={refreshControl} contentContainerStyle={[styles.page, pageContentStyle]}>
                <AdminUsersTab styles={styles} users={users} language={language} titleStyle={titleStyle} subtitleStyle={subtitleStyle} statCardStyle={statCardStyle} searchInputSurfaceStyle={searchInputSurfaceStyle} listItemStyle={listItemStyle} listFlexStyle={listFlexStyle} avatarStyle={avatarStyle} activePillStyle={activePillStyle} inactivePillStyle={inactivePillStyle} activePillTextStyle={activePillTextStyle} inactivePillTextStyle={inactivePillTextStyle} userMenuButtonStyle={userMenuButtonStyle} roleChipSurfaceStyle={roleChipSurfaceStyle} paletteMuted={palette.muted} canOpenUserMenu={canEditUsers || canDeleteUsers} userFilter={userFilter} userQuery={userQuery} onSetUserFilter={setUserFilter} onSetUserQuery={setUserQuery} onOpenUserMenu={openUserMenu} />
              </ScrollView>
            );
          }
          if (tab.key === 'announcements') {
            return (
              <ScrollView key={tab.key} refreshControl={refreshControl} contentContainerStyle={[styles.page, pageContentStyle]}>
                <AdminAnnouncementsTab
                  styles={styles}
                  data={announcements}
                  loading={announcementsLoading}
                  error={announcementsError}
                  language={language}
                  titleStyle={titleStyle}
                  subtitleStyle={subtitleStyle}
                  cardStyle={cardStyle}
                  headerActionStyle={headerActionStyle}
                  headerActionTextStyle={headerActionTextStyle}
                  canApprove={canApproveAnnouncements}
                  canDelete={canDeleteAnnouncements}
                  onRefresh={refreshAnnouncements}
                  onApprove={handleApproveAnnouncement}
                  onDelete={handleDeleteAnnouncement}
                />
              </ScrollView>
            );
          }
          return (
            <ScrollView key={tab.key} refreshControl={refreshControl} contentContainerStyle={[styles.page, pageContentStyle]}>
              <AdminRolesTab styles={styles} roles={roles} language={language} titleStyle={titleStyle} subtitleStyle={subtitleStyle} cardStyle={cardStyle} headerActionStyle={headerActionStyle} headerActionTextStyle={headerActionTextStyle} canManageRoles={canManageRoles} onOpenRoleManager={() => navigation.navigate('RoleManager')} />
            </ScrollView>
          );
        })}
      </ScrollView>

        <View style={[styles.bottomBar, bottomBarStyle]}>
        {visibleTabs.map(tab => {
          const index = visibleTabs.findIndex(item => item.key === tab.key);
          const active = index === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => jumpTo(index)}
                style={[styles.tabBtn, active ? activeTabStyle : null]}>
              <Ionicons name={tab.icon} size={18} color={active ? palette.primaryText : palette.muted} />
                <Text numberOfLines={1} style={[styles.tabText, active ? activeTabTextStyle : inactiveTabTextStyle]}>
                {t(language, tab.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={userMenuOpen} transparent animationType="fade" onRequestClose={closeUserMenu}>
        <Pressable style={[styles.modalOverlay, modalBackdropStyle]} onPress={closeUserMenu}>
          <Pressable style={[styles.bottomSheet, modalCardStyle]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderContent}>
                <Text style={[styles.modalTitle, modalTitleStyle]}>{activeUser?.fullName ?? 'User actions'}</Text>
                <Text style={[styles.modalSubtitle, modalSecondaryTextStyle]}>{activeUser?.email ?? ''}</Text>
              </View>
              <Pressable onPress={closeUserMenu} style={[styles.modalCloseBtn, { borderColor: palette.border }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            {activeUser && session?.userId !== activeUser.userId && canEditUsers ? (
              <>
                <Pressable
                  style={[styles.actionRow, actionMenuItemStyle]}
                  onPress={() => openRolePicker('assign')}>
                  <Ionicons name="person-add-outline" size={18} color={palette.text} />
                  <Text style={[styles.actionRowText, modalTitleStyle]}>Assign role</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionRow, actionMenuItemStyle]}
                  onPress={() => openRolePicker('remove')}>
                  <Ionicons name="person-remove-outline" size={18} color={palette.text} />
                  <Text style={[styles.actionRowText, modalTitleStyle]}>Remove role</Text>
                </Pressable>
              </>
            ) : null}
            {activeUser && session?.userId !== activeUser.userId && !isSuperAdmin(activeUser) && canEditUsers ? (
              <Pressable
                style={[styles.actionRow, actionMenuItemStyle]}
                onPress={() => {
                  closeUserMenu();
                  withReload(() => runUserAction('toggle'));
                }}>
                <Ionicons name="power-outline" size={18} color={palette.text} />
                <Text style={[styles.actionRowText, modalTitleStyle]}>Toggle active</Text>
              </Pressable>
            ) : null}
            {activeUser && session?.userId !== activeUser.userId && !isSuperAdmin(activeUser) && canDeleteUsers ? (
              <Pressable
                style={[styles.actionRow, styles.actionRowDanger, actionMenuDangerStyle]}
                onPress={() => {
                  closeUserMenu();
                  withReload(() => runUserAction('delete'));
                }}>
                <Ionicons name="trash-outline" size={18} color="#991B1B" />
                <Text style={[styles.actionRowText, actionMenuDangerTextStyle]}>Delete user</Text>
              </Pressable>
            ) : null}
            {activeUser && (
              (!canEditUsers && !canDeleteUsers) ||
              session?.userId === activeUser.userId ||
              isSuperAdmin(activeUser)
            ) ? (
              <Text style={[styles.actionHint, modalSecondaryTextStyle]}>
                {!canEditUsers && !canDeleteUsers
                  ? 'No actions available for your permissions.'
                  : session?.userId === activeUser.userId
                    ? 'You cannot change your own roles.'
                    : 'Super admin hesabı qorunur.'}
              </Text>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rolePickerOpen} transparent animationType="fade" onRequestClose={closeRolePicker}>
        <Pressable style={[styles.modalOverlay, modalBackdropStyle]} onPress={closeRolePicker}>
          <Pressable style={[styles.bottomSheet, modalCardStyle]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderContent}>
                <Text style={[styles.modalTitle, modalTitleStyle]}>
                  {pendingUserAction === 'assign' ? 'Assign role' : 'Remove role'}
                </Text>
                <Text style={[styles.modalSubtitle, modalSecondaryTextStyle]}>
                  {pendingUserAction === 'remove'
                    ? `Pick a role to remove from ${activeUser?.fullName ?? 'this user'}.`
                    : `Pick a role to assign to ${activeUser?.fullName ?? 'this user'}.`}
                </Text>
              </View>
              <Pressable onPress={closeRolePicker} style={[styles.modalCloseBtn, { borderColor: palette.border }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            {rolePickerOptions.length === 0 ? (
              <Text style={[styles.emptyText, subtitleStyle]}>
                {pendingUserAction === 'remove' ? 'This user has no roles.' : 'No roles available.'}
              </Text>
            ) : (
              <ScrollView style={styles.rolePickerScroll} showsVerticalScrollIndicator={false}>
                {rolePickerOptions.map(roleName => (
                  <Pressable
                    key={roleName}
                    style={[styles.rolePickerItem, { borderColor: palette.border }]}
                    onPress={() =>
                      withReload(async () => {
                        await runRoleAction(roleName);
                        closeRolePicker();
                      })
                    }>
                    <Text style={[styles.rolePickerText, modalTitleStyle]}>{roleName}</Text>
                    <Ionicons name="chevron-forward" size={18} color={palette.muted} />
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={closeRolePicker}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#B91C1C', paddingHorizontal: 16, marginBottom: 8, fontWeight: '600' },
  page: { paddingHorizontal: 16 },
  sectionHeader: { marginTop: 6, marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionSubtitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  chartBlock: { marginTop: 10, gap: 8 },
  chartBarBg: { height: 10, borderRadius: 999, overflow: 'hidden' },
  chartBarFill: { height: '100%', backgroundColor: '#D4B483' },
  primaryBtn: { marginTop: 12, borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  primaryBtnText: { fontWeight: '800' },
  loader: { marginTop: 24 },
  itemCard: { marginTop: 12, borderRadius: 16, padding: 14 },
  itemTitle: { fontSize: 16, fontWeight: '800' },
  itemMeta: { marginTop: 5, fontSize: 13 },
  emptyText: { marginTop: 10, fontSize: 13, fontWeight: '600' },
  productsEmptyList: { flexGrow: 1 },
  productsError: { marginTop: 10 },
  productsFooter: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  productsFooterText: { fontSize: 12, fontWeight: '700' },
  productCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  productThumbWrap: { height: 160, backgroundColor: '#E5E7EB' },
  productThumb: { width: '100%', height: '100%' },
  productCardBody: { padding: 14 },
  productTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  productBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  productBadgeText: { fontSize: 11, fontWeight: '800' },
  productMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { fontSize: 18, fontWeight: '900' },
  productStock: { fontSize: 12, fontWeight: '700' },
  productActionRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  productActionBtn: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  productActionText: { fontWeight: '800' },
  productActionDanger: { backgroundColor: '#FEE2E2' },
  productActionDangerText: { color: '#991B1B', fontWeight: '800' },
  statsRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statNumber: { fontSize: 18, fontWeight: '900' },
  statLabel: { marginTop: 2, fontSize: 12, fontWeight: '700' },
  searchPanel: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  searchInputWrap: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  clearSearchBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  filterRow: { marginTop: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '800' },
  listItem: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  userRowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '900' },
  userTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userMetaLine: { marginTop: 2, fontSize: 12, fontWeight: '700' },
  roleChipRow: { marginTop: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  roleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleChipText: { fontSize: 12, fontWeight: '700' },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  protectedText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  bottomSheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  modalHeaderContent: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowDanger: {
    marginBottom: 4,
  },
  actionHint: { marginTop: 10, fontSize: 13, fontWeight: '600' },
  actionRowText: { fontSize: 14, fontWeight: '700' },
  rolePickerScroll: { maxHeight: 240 },
  rolePickerItem: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rolePickerText: { fontSize: 14, fontWeight: '700' },
  modalActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  panelPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  panelPickerCard: { width: '86%', borderRadius: 12, padding: 14 },
  centerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  centerModal: { width: '86%', borderWidth: 1, borderRadius: 14, padding: 16 },
  panelPickerRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  panelPickerButton: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 10, alignItems: 'center' },
  panelPickerButtonText: { marginTop: 8, fontWeight: '800' },
  secondaryBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '800', color: '#111827' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabText: { marginTop: 4, fontSize: 11, fontWeight: '700' },
});
