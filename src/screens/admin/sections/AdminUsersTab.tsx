import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { AdminUser } from '../../../types/admin';
import { t } from '../../../i18n';

type UserFilter = 'all' | 'active' | 'inactive';

type Props = {
  styles: any;
  users: AdminUser[];
  language: any;
  titleStyle: any;
  subtitleStyle: any;
  statCardStyle: any;
  searchInputSurfaceStyle: any;
  listItemStyle: any;
  listFlexStyle: any;
  avatarStyle: any;
  activePillStyle: any;
  inactivePillStyle: any;
  activePillTextStyle: any;
  inactivePillTextStyle: any;
  userMenuButtonStyle: any;
  roleChipSurfaceStyle: any;
  paletteMuted: string;
  canOpenUserMenu: boolean;
  userFilter: UserFilter;
  userQuery: string;
  onSetUserFilter: (value: UserFilter) => void;
  onSetUserQuery: (value: string) => void;
  onOpenUserMenu: (user: AdminUser) => void;
};

function getUserKey(user: AdminUser, index: number) {
  return user.userId || user.email || user.userName || `idx-${index}`;
}

function isSuperAdmin(user: AdminUser) {
  const email = user.email.toLowerCase();
  const username = user.userName.toLowerCase();
  return email === 'admin@phantoms.com' || username === 'admin';
}

export function AdminUsersTab(props: Props) {
  const {
    styles, users, language, titleStyle, subtitleStyle, statCardStyle, searchInputSurfaceStyle, listItemStyle, listFlexStyle,
    avatarStyle, activePillStyle, inactivePillStyle, activePillTextStyle, inactivePillTextStyle, userMenuButtonStyle,
    roleChipSurfaceStyle, paletteMuted, canOpenUserMenu, userFilter, userQuery, onSetUserFilter, onSetUserQuery, onOpenUserMenu,
  } = props;

  const query = userQuery.trim().toLowerCase();
  const filteredUsers = users.filter(user => {
    const matchesFilter = userFilter === 'all' || (userFilter === 'active' && user.isActive) || (userFilter === 'inactive' && !user.isActive);
    const searchable = [user.fullName, user.email, user.userName, user.roles.join(' ')].join(' ').toLowerCase();
    return matchesFilter && (!query || searchable.includes(query));
  });

  const userStats = {
    total: users.length,
    active: users.filter(user => user.isActive).length,
    inactive: users.filter(user => !user.isActive).length,
  };

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, titleStyle]}>{t(language, 'users')}</Text>
        <Text style={[styles.sectionSubtitle, subtitleStyle]}>{t(language, 'users_subtitle')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, statCardStyle]}><Text style={[styles.statNumber, titleStyle]}>{userStats.total}</Text><Text style={[styles.statLabel, subtitleStyle]}>{t(language, 'total')}</Text></View>
        <View style={[styles.statCard, statCardStyle]}><Text style={[styles.statNumber, titleStyle]}>{userStats.active}</Text><Text style={[styles.statLabel, subtitleStyle]}>{t(language, 'active')}</Text></View>
        <View style={[styles.statCard, statCardStyle]}><Text style={[styles.statNumber, titleStyle]}>{userStats.inactive}</Text><Text style={[styles.statLabel, subtitleStyle]}>{t(language, 'inactive')}</Text></View>
      </View>

      <View style={[styles.searchPanel, { borderColor: '#D1D5DB' }]}>
        <View style={[styles.searchInputWrap, searchInputSurfaceStyle]}>
          <Ionicons name="search-outline" size={18} color={paletteMuted} />
          <TextInput value={userQuery} onChangeText={onSetUserQuery} placeholder={t(language, 'search_users')} placeholderTextColor={paletteMuted} style={[styles.searchInput, titleStyle]} autoCapitalize="none" autoCorrect={false} returnKeyType="search" />
          {userQuery ? <Pressable onPress={() => onSetUserQuery('')} style={styles.clearSearchBtn}><Ionicons name="close-circle" size={18} color={paletteMuted} /></Pressable> : null}
        </View>

        <View style={styles.filterRow}>
          {([['all', t(language, 'all')], ['active', t(language, 'active')], ['inactive', t(language, 'inactive')]] as Array<[UserFilter, string]>).map(([value, label]) => {
            const selected = userFilter === value;
            return (
              <Pressable key={value} onPress={() => onSetUserFilter(value)} style={[styles.filterChip, { borderColor: '#D1D5DB' }, selected && { backgroundColor: '#101826', borderColor: '#101826' }]}>
                <Text style={[styles.filterChipText, selected ? { color: '#F4F1EA' } : titleStyle]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filteredUsers.length === 0 ? <Text style={[styles.emptyText, subtitleStyle]}>{t(language, 'no_users')}</Text> : filteredUsers.map((user, index) => {
        const userKey = getUserKey(user, index);
        const lockedSuperAdmin = isSuperAdmin(user);
        const initials = user.fullName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
        return (
          <View key={userKey} style={[styles.listItem, listItemStyle]}>
            <View style={styles.userRowTop}>
              <View style={[styles.avatarCircle, avatarStyle]}><Text style={[styles.avatarText, titleStyle]}>{initials || '?'}</Text></View>
              <View style={listFlexStyle}>
                <View style={styles.userTitleRow}>
                  <Text style={[styles.itemTitle, titleStyle]} numberOfLines={1}>{user.fullName}</Text>
                  <View style={[styles.statusPill, user.isActive ? activePillStyle : inactivePillStyle]}>
                    <Text style={[styles.statusPillText, user.isActive ? activePillTextStyle : inactivePillTextStyle]}>{user.isActive ? t(language, 'active') : t(language, 'inactive')}</Text>
                  </View>
                </View>
                <Text style={[styles.itemMeta, subtitleStyle]} numberOfLines={1}>{user.email}</Text>
                <Text style={[styles.userMetaLine, subtitleStyle]} numberOfLines={1}>@{user.userName || '-'}</Text>
              </View>

              {canOpenUserMenu ? <Pressable onPress={() => onOpenUserMenu(user)} style={[styles.menuBtn, userMenuButtonStyle]}><Ionicons name="ellipsis-vertical" size={18} color="#111827" /></Pressable> : null}
            </View>

            <View style={styles.roleChipRow}>
              {(user.roles.length > 0 ? user.roles.slice(0, 2) : [t(language, 'no_role')]).map(roleName => (
                <View key={`${userKey}-${roleName}`} style={[styles.roleChip, roleChipSurfaceStyle]}><Text style={[styles.roleChipText, subtitleStyle]}>{roleName}</Text></View>
              ))}
            </View>

            {lockedSuperAdmin ? <Text style={[styles.protectedText, subtitleStyle]}>{t(language, 'protected_super_admin')}</Text> : null}
          </View>
        );
      })}
    </>
  );
}
