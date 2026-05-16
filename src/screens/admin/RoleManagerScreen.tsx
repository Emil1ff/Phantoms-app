import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  addPermissionsThunk,
  createRoleThunk,
  deleteRoleThunk,
  fetchPermissionsCatalog,
  fetchRolePermissions,
  fetchRoles,
  removePermissionsThunk,
} from '../../redux/slices/rolesSlice';

const MODAL_HEIGHT = 520;
const PROTECTED_ROLE_NAMES = ['admin'];

type Props = NativeStackScreenProps<RootStackParamList, 'RoleManager'>;

type PermissionGroup = {
  title: string;
  items: string[];
};

function isProtectedRole(name: string | null | undefined) {
  if (!name) return false;
  return PROTECTED_ROLE_NAMES.includes(name.trim().toLowerCase());
}

function groupPermissions(catalog: Record<string, string[]>): PermissionGroup[] {
  return Object.entries(catalog).map(([title, items]) => ({
    title,
    items,
  }));
}

export function RoleManagerScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width >= 900 ? Math.min(width - 80, 980) : width - 32;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const roles = useAppSelector(state => state.roles.list);
  const roleStatus = useAppSelector(state => state.roles.status);
  const roleError = useAppSelector(state => state.roles.error);
  const catalog = useAppSelector(state => state.roles.permissionsCatalog);
  const catalogStatus = useAppSelector(state => state.roles.catalogStatus);
  const catalogError = useAppSelector(state => state.roles.catalogError);

  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRolePickerOpen, setRolePickerOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isManageOpen, setManageOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);

  const [managePermissions, setManagePermissions] = useState<string[]>([]);

  const permissionGroups = useMemo(() => groupPermissions(catalog ?? {}), [catalog]);
  const isLoading = roleStatus === 'loading' || catalogStatus === 'loading';

  const selectedRole = roles.find(role => role.name === selectedRoleName) ?? null;
  const selectedRolePermissions = selectedRole?.permissions ?? [];
  const isSelectedRoleProtected = isProtectedRole(selectedRole?.name);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissionsCatalog());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRoleName && roles.length > 0) {
      setSelectedRoleName(roles[0].name);
    }
  }, [roles, selectedRoleName]);

  useEffect(() => {
    if (!selectedRoleName) {
      return;
    }
    dispatch(fetchRolePermissions(selectedRoleName));
  }, [dispatch, selectedRoleName]);

  const openManage = useCallback(() => {
    if (!selectedRole) {
      setLocalError('Select a role first.');
      return;
    }
    setLocalError(null);
    setManagePermissions(selectedRole.permissions ?? []);
    setManageOpen(true);
  }, [selectedRole]);

  const toggleSelection = useCallback((value: string, list: string[], setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter(item => item !== value));
      return;
    }
    setter([...list, value]);
  }, []);

  async function refreshRoles() {
    await dispatch(fetchRoles()).unwrap();
  }

  async function handleCreateRole() {
    const name = createName.trim();
    if (!name) {
      setLocalError('Role name is required.');
      return;
    }

    try {
      setSaving(true);
      setLocalError(null);
      await dispatch(
        createRoleThunk({
          name,
          description: createDescription.trim(),
          permissions: createPermissions,
        }),
      ).unwrap();
      await refreshRoles();
      setCreateName('');
      setCreateDescription('');
      setCreatePermissions([]);
      setCreateOpen(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Role creation failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePermissions() {
    if (!selectedRole) {
      return;
    }

    const current = new Set(selectedRolePermissions);
    const selected = new Set(managePermissions);
    const toAdd = managePermissions.filter(item => !current.has(item));
    const toRemove = selectedRolePermissions.filter(item => !selected.has(item));

    try {
      setSaving(true);
      setLocalError(null);
      if (toAdd.length > 0) {
        await dispatch(addPermissionsThunk({ roleName: selectedRole.name, permissions: toAdd })).unwrap();
      }
      if (toRemove.length > 0) {
        await dispatch(removePermissionsThunk({ roleName: selectedRole.name, permissions: toRemove })).unwrap();
      }
      await refreshRoles();
      setManageOpen(false);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Permission update failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(roleName: string) {
    if (isProtectedRole(roleName)) {
      setLocalError('Admin role cannot be deleted.');
      return;
    }
    try {
      setSaving(true);
      setLocalError(null);
      await dispatch(deleteRoleThunk(roleName)).unwrap();
      await refreshRoles();
      if (selectedRoleName === roleName) {
        setSelectedRoleName(null);
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Role delete failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#101826" />
        </Pressable>
        <Text style={styles.headerTitle}>Role Manager</Text>
        <View style={styles.iconBtn} />
      </View>

      {roleError ? <Text style={styles.error}>{roleError}</Text> : null}
      {catalogError ? <Text style={styles.error}>{catalogError}</Text> : null}
      {localError ? <Text style={styles.error}>{localError}</Text> : null}

      <ScrollView contentContainerStyle={[styles.content, { width: contentWidth, alignSelf: 'center' }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Roles</Text>
          <Pressable onPress={() => setCreateOpen(true)} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Create role</Text>
          </Pressable>
        </View>

        <Pressable style={styles.selector} onPress={() => setRolePickerOpen(true)}>
          <Text style={styles.selectorLabel}>Selected role</Text>
          <View style={styles.selectorRow}>
            <Text style={styles.selectorValue}>{selectedRole?.name ?? 'Choose role'}</Text>
            <Ionicons name="chevron-down" size={16} color="#1F2937" />
          </View>
        </Pressable>

        {selectedRole ? (
          <View style={styles.card}>
            <View style={styles.roleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{selectedRole.name}</Text>
                <Text style={styles.cardMeta}>{selectedRole.description || 'No description'}</Text>
              </View>
              <Pressable
                onPress={() => handleDeleteRole(selectedRole.name)}
                disabled={isSaving || isSelectedRoleProtected}
                style={[
                  styles.secondaryBtn,
                  styles.dangerBtn,
                  (isSaving || isSelectedRoleProtected) && styles.disabledBtn,
                ]}
              >
                <Text style={styles.secondaryBtnText}>
                  {isSelectedRoleProtected ? 'Protected' : 'Delete'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.cardLabel}>Permissions</Text>
            <View style={styles.chipsWrap}>
              {selectedRolePermissions.length === 0 ? (
                <Text style={styles.cardMeta}>No permissions assigned.</Text>
              ) : (
                selectedRolePermissions.map(permission => (
                  <View key={permission} style={styles.chip}>
                    <Text style={styles.chipText}>{permission}</Text>
                  </View>
                ))
              )}
            </View>

            <Pressable onPress={openManage} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Manage permissions</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.emptyText}>Select a role to manage permissions.</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Permissions catalog</Text>
        </View>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color="#101826" />
        ) : permissionGroups.length === 0 ? (
          <Text style={styles.emptyText}>No permissions available.</Text>
        ) : (
          permissionGroups.map(group => (
            <View key={group.title} style={styles.catalogCard}>
              <Text style={styles.catalogTitle}>{group.title}</Text>
              <View style={styles.catalogChips}>
                {group.items.map(item => (
                  <View key={item} style={styles.catalogChip}>
                    <Text style={styles.catalogText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={isRolePickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select role</Text>
              <Pressable onPress={() => setRolePickerOpen(false)}>
                <Ionicons name="close" size={18} color="#1F2937" />
              </Pressable>
            </View>
            <ScrollView>
              {roles.map(role => (
                <Pressable
                  key={role.name}
                  onPress={() => {
                    setSelectedRoleName(role.name);
                    setRolePickerOpen(false);
                  }}
                  style={styles.modalRow}
                >
                  <Text style={styles.modalRowText}>{role.name}</Text>
                  {selectedRoleName === role.name ? (
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isCreateOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: MODAL_HEIGHT }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create role</Text>
              <Pressable onPress={() => setCreateOpen(false)}>
                <Ionicons name="close" size={18} color="#1F2937" />
              </Pressable>
            </View>
            <ScrollView>
              <Text style={styles.modalLabel}>Role name</Text>
              <TextInput
                placeholder="Role name"
                placeholderTextColor="#9CA3AF"
                style={styles.modalInput}
                value={createName}
                onChangeText={setCreateName}
              />
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                placeholder="Description"
                placeholderTextColor="#9CA3AF"
                style={styles.modalInput}
                value={createDescription}
                onChangeText={setCreateDescription}
              />
              <Text style={styles.modalLabel}>Permissions</Text>
              {permissionGroups.length === 0 ? (
                <Text style={styles.modalHint}>No permissions available.</Text>
              ) : (
                permissionGroups.map(group => (
                  <View key={`create-${group.title}`} style={styles.permissionGroup}>
                    <Text style={styles.permissionGroupTitle}>{group.title}</Text>
                    {group.items.map(item => {
                      const active = createPermissions.includes(item);
                      return (
                        <Pressable
                          key={`create-${item}`}
                          onPress={() => toggleSelection(item, createPermissions, setCreatePermissions)}
                          style={[styles.permissionRow, active && styles.permissionRowActive]}
                        >
                          <Ionicons
                            name={active ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={active ? '#101826' : '#9CA3AF'}
                          />
                          <Text style={styles.permissionRowText}>{item}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={handleCreateRole} disabled={isSaving}>
                <Text style={styles.primaryBtnText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isManageOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { height: MODAL_HEIGHT }]}> 
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage permissions</Text>
              <Pressable onPress={() => setManageOpen(false)}>
                <Ionicons name="close" size={18} color="#1F2937" />
              </Pressable>
            </View>
            <ScrollView>
              {permissionGroups.length === 0 ? (
                <Text style={styles.modalHint}>No permissions available.</Text>
              ) : (
                permissionGroups.map(group => (
                  <View key={`manage-${group.title}`} style={styles.permissionGroup}>
                    <Text style={styles.permissionGroupTitle}>{group.title}</Text>
                    {group.items.map(item => {
                      const active = managePermissions.includes(item);
                      return (
                        <Pressable
                          key={`manage-${item}`}
                          onPress={() => toggleSelection(item, managePermissions, setManagePermissions)}
                          style={[styles.permissionRow, active && styles.permissionRowActive]}
                        >
                          <Ionicons
                            name={active ? 'checkbox' : 'square-outline'}
                            size={18}
                            color={active ? '#101826' : '#9CA3AF'}
                          />
                          <Text style={styles.permissionRowText}>{item}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setManageOpen(false)}>
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={handleSavePermissions} disabled={isSaving}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101826',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE2D4',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  error: {
    marginHorizontal: 18,
    color: '#B91C1C',
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101826',
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  selectorRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: '#101826',
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  cardMeta: {
    marginTop: 6,
    color: '#CBD5E1',
    fontSize: 12,
  },
  cardLabel: {
    marginTop: 14,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  chipsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: '#F9FAFB',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#D4B483',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#0D1321',
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#F9FAFB',
    fontWeight: '700',
  },
  dangerBtn: {
    backgroundColor: '#B91C1C',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  loader: {
    marginTop: 10,
  },
  catalogCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  catalogTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  catalogChips: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catalogChip: {
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  catalogText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: MODAL_HEIGHT,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  modalLabel: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalInput: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  modalHint: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  permissionGroup: {
    marginTop: 12,
  },
  permissionGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  permissionRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  permissionRowActive: {
    backgroundColor: '#E4D2B3',
    borderColor: '#D4B483',
  },
  permissionRowText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
});
