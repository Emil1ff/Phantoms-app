import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Role } from '../../../types/roles';
import { t } from '../../../i18n';

type Props = {
  styles: any;
  roles: Role[];
  language: any;
  titleStyle: any;
  subtitleStyle: any;
  cardStyle: any;
  headerActionStyle: any;
  headerActionTextStyle: any;
  canManageRoles: boolean;
  onOpenRoleManager: () => void;
};

export function AdminRolesTab({
  styles,
  roles,
  language,
  titleStyle,
  subtitleStyle,
  cardStyle,
  headerActionStyle,
  headerActionTextStyle,
  canManageRoles,
  onOpenRoleManager,
}: Props) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, titleStyle]}>{t(language, 'roles')}</Text>
        <Text style={[styles.sectionSubtitle, subtitleStyle]}>{t(language, 'roles_subtitle')}</Text>
      </View>

      <View>
        {canManageRoles && (
          <View style={[styles.itemCard, cardStyle]}>
            <Text style={[styles.itemTitle, titleStyle]}>{t(language, 'role_workspace')}</Text>
            <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'role_workspace_desc')}</Text>
            <Pressable style={[styles.primaryBtn, headerActionStyle, !canManageRoles && styles.disabledBtn]} onPress={onOpenRoleManager} disabled={!canManageRoles}>
              <Text style={[styles.primaryBtnText, headerActionTextStyle]}>{t(language, 'open_role_manager')}</Text>
            </Pressable>
            <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'manage_permission_required')}</Text>
          </View>
        )}
      </View>

      {roles.length === 0 ? (
        <Text style={[styles.emptyText, subtitleStyle]}>{t(language, 'no_roles')}</Text>
      ) : (
        roles.map(role => (
          <View key={role.name} style={[styles.itemCard, cardStyle]}>
            <Text style={[styles.itemTitle, titleStyle]}>{role.name}</Text>
            <Text style={[styles.itemMeta, subtitleStyle]}>{role.description || t(language, 'no_description')}</Text>
            <Text style={[styles.itemMeta, subtitleStyle]}>{(role.permissions ?? []).length} {t(language, 'permissions')}</Text>
          </View>
        ))
      )}
    </>
  );
}

