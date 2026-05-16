import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AdminAnnouncement } from '../../../types/admin';
import { t } from '../../../i18n';

type Props = {
  styles: any;
  data: AdminAnnouncement[];
  loading: boolean;
  error: string | null;
  language: any;
  titleStyle: any;
  subtitleStyle: any;
  cardStyle: any;
  headerActionStyle: any;
  headerActionTextStyle: any;
  canApprove: boolean;
  canDelete: boolean;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
};

export function AdminAnnouncementsTab(props: Props) {
  const {
    styles,
    data,
    loading,
    error,
    language,
    titleStyle,
    subtitleStyle,
    cardStyle,
    headerActionStyle,
    headerActionTextStyle,
    canApprove,
    canDelete,
    onRefresh,
    onApprove,
    onDelete,
  } = props;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, titleStyle]}>{t(language, 'announcements')}</Text>
        <Text style={[styles.sectionSubtitle, subtitleStyle]}>Admin elan siyahisi ve yoxlama paneli.</Text>
      </View>

      <Pressable onPress={onRefresh} style={[styles.primaryBtn, headerActionStyle]}>
        <Text style={[styles.primaryBtnText, headerActionTextStyle]}>{t(language, 'reload_data')}</Text>
      </Pressable>

      {loading ? <Text style={[styles.itemMeta, subtitleStyle]}>Loading...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {data.map(item => (
        <View key={item.id} style={[styles.itemCard, cardStyle]}>
          <Text style={[styles.itemTitle, titleStyle]}>{item.title}</Text>
          <Text style={[styles.itemMeta, subtitleStyle]}>{item.category || 'General'}</Text>
          <Text style={[styles.itemMeta, subtitleStyle]}>{item.content}</Text>
          <Text style={[styles.itemMeta, subtitleStyle]}>{item.isApproved ? 'Approved' : 'Pending'}</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {!item.isApproved && canApprove ? (
              <Pressable onPress={() => onApprove(item.id)} style={[styles.primaryBtn, { flex: 1, marginTop: 0 }, headerActionStyle]}>
                <Text style={[styles.primaryBtnText, headerActionTextStyle]}>Approve</Text>
              </Pressable>
            ) : null}
            {canDelete ? (
              <Pressable onPress={() => onDelete(item.id)} style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}>
                <Text style={styles.secondaryBtnText}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      {data.length === 0 && !loading ? <Text style={[styles.emptyText, subtitleStyle]}>No announcements.</Text> : null}
    </>
  );
}
