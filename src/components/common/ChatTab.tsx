import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { t } from '../../i18n';
import { useAppSelector } from '../../hooks/redux';
import { deleteMessage, getConversationMessages, getConversations, sendMessage } from '../../services/messages/messagesService';
import type { ConversationItem, MessageItem } from '../../types/messages';

type Props = {
  token: string;
  currentUserId?: string;
  isDark: boolean;
};

function formatTime(value: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function ChatTab({ token, currentUserId, isDark }: Props) {
  const language = useAppSelector(state => state.ui.language);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find(item => item.otherUserId === selectedUserId) ?? null,
    [conversations, selectedUserId],
  );

  const palette = {
    card: isDark ? '#111C31' : '#FFFFFF',
    border: isDark ? '#24344F' : '#D8CFBF',
    text: isDark ? '#F3F4F6' : '#101826',
    muted: isDark ? '#9CA3AF' : '#64748B',
    bg: isDark ? '#0B1220' : '#F4F1EA',
    bubbleMine: isDark ? '#1D4ED8' : '#101826',
    bubbleOther: isDark ? '#1E293B' : '#EEF2FF',
  };

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const list = await getConversations(token);
      setConversations(list);
      if (!selectedUserId && list.length > 0) {
        setSelectedUserId(list[0].otherUserId);
      }
      if (selectedUserId && !list.some(item => item.otherUserId === selectedUserId)) {
        setSelectedUserId(list[0]?.otherUserId ?? '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, token]);

  const loadMessages = useCallback(async () => {
    if (!token || !selectedUserId) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      setError(null);
      const result = await getConversationMessages(selectedUserId, token, { page: 1, pageSize: 50 });
      setMessages(result.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedUserId, token]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function handleSend() {
    const content = draft.trim();
    if (!token || !selectedUserId || !content) {
      return;
    }
    try {
      setSending(true);
      await sendMessage({ receiverId: selectedUserId, content }, token);
      setDraft('');
      await loadMessages();
      await loadConversations();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    if (!token) return;
    try {
      await deleteMessage(messageId, token);
      await loadMessages();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  return (
    <View style={styles.root}>
      <Text style={[styles.title, { color: palette.text }]}>{t(language, 'messages')}</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>{t(language, 'messages_subtitle')}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conversationRow}>
        {conversations.map(item => {
          const active = item.otherUserId === selectedUserId;
          return (
            <Pressable
              key={item.otherUserId}
              onPress={() => setSelectedUserId(item.otherUserId)}
              style={[
                styles.conversationCard,
                { borderColor: palette.border, backgroundColor: palette.card },
                active && { borderColor: '#2563EB' },
              ]}>
              <Text numberOfLines={1} style={[styles.conversationName, { color: palette.text }]}>{item.otherUserName || item.otherUserEmail || 'User'}</Text>
              <Text numberOfLines={1} style={[styles.conversationLast, { color: palette.muted }]}>{item.lastMessage || '...'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.chatBox, { borderColor: palette.border, backgroundColor: palette.card }]}>
        {selectedConversation ? (
          <Text style={[styles.chatHeader, { color: palette.text }]}>
            {selectedConversation.otherUserName || selectedConversation.otherUserEmail}
          </Text>
        ) : (
          <Text style={[styles.chatHeader, { color: palette.muted }]}>{t(language, 'select_conversation')}</Text>
        )}

        <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesListContent}>
          {messagesLoading ? <Text style={[styles.empty, { color: palette.muted }]}>{t(language, 'loading')}</Text> : null}
          {!messagesLoading && messages.length === 0 ? (
            <Text style={[styles.empty, { color: palette.muted }]}>{t(language, 'no_messages_yet')}</Text>
          ) : null}
          {messages.map(item => {
            const mine = item.senderId === currentUserId;
            return (
              <View key={item.id} style={[styles.messageRow, mine ? styles.messageRowRight : styles.messageRowLeft]}>
                <Pressable
                  onLongPress={() => {
                    if (mine) {
                      void handleDelete(item.id);
                    }
                  }}
                  style={[
                    styles.bubble,
                    { backgroundColor: mine ? palette.bubbleMine : palette.bubbleOther },
                  ]}>
                  <Text style={[styles.bubbleText, { color: '#F8FAFC' }]}>{item.content}</Text>
                  <Text style={styles.bubbleTime}>{formatTime(item.createdAt)}</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.inputRow, { borderTopColor: palette.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t(language, 'type_message')}
            placeholderTextColor={palette.muted}
            style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.bg }]}
            editable={Boolean(selectedUserId) && !sending}
          />
          <Pressable
            onPress={() => void handleSend()}
            style={[styles.sendBtn, { opacity: sending || !selectedUserId ? 0.65 : 1 }]}
            disabled={sending || !selectedUserId}>
            <Ionicons name="send" size={16} color="#F8FAFC" />
          </Pressable>
        </View>
      </View>

      <Pressable onPress={() => void loadConversations()} style={[styles.refreshBtn, { borderColor: palette.border }]}>
        <Ionicons name="refresh" size={16} color={palette.text} />
        <Text style={[styles.refreshText, { color: palette.text }]}>{loading ? `${t(language, 'loading')}` : t(language, 'refresh')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 10 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { marginTop: 4, fontWeight: '600' },
  error: { marginTop: 8, color: '#B91C1C', fontWeight: '700' },
  conversationRow: { marginTop: 12, paddingRight: 10, gap: 8 },
  conversationCard: { width: 190, borderWidth: 1, borderRadius: 12, padding: 10 },
  conversationName: { fontWeight: '800' },
  conversationLast: { marginTop: 4, fontSize: 12 },
  chatBox: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 10, minHeight: 280 },
  chatHeader: { fontWeight: '800', marginBottom: 8 },
  messagesList: { maxHeight: 300 },
  messagesListContent: { paddingBottom: 8 },
  empty: { marginTop: 8 },
  messageRow: { marginTop: 8, flexDirection: 'row' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  bubbleText: { fontWeight: '600' },
  bubbleTime: { marginTop: 4, fontSize: 10, color: '#CBD5E1' },
  inputRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontWeight: '600' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#101826', alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { marginTop: 10, minHeight: 40, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  refreshText: { fontWeight: '700' },
});
