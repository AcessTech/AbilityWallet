import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Logo } from '../components/ui';
import { Icon } from '../components/Icon';
import { supabase } from '../lib/supabase';
import { color, font, radius } from '../theme/tokens';
import { initials, money, shortDate, tileColor } from '../lib/format';

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender: 'member' | 'navigator' | 'ai' | 'system';
  body: string;
  action: { kind: string; label: string; amount?: number; from?: string; to?: string } | null;
  action_status: 'pending' | 'confirmed' | 'declined' | 'expired' | null;
  txn_id: string | null;
  created_at: string;
}

/**
 * The Help thread. One conversation: the Navigator and the AI helper are both
 * in it with the Member (brief §2 rule 5).
 *
 * At Independent the AI thread is private to the Member and the Navigator gets
 * a separate 1:1 — the RLS policy on chat_threads enforces that, so this
 * component renders whichever thread it is handed.
 *
 * An action the AI proposes appears as a confirmation card inside the thread
 * with static gold Yes / grey No. It executes only on Yes.
 */
export function Chat({
  memberId,
  threadKind = 'help',
  me,
  title,
  subtitle,
  attachedTxnId,
  reportProblem = false,
}: {
  memberId: string;
  threadKind?: 'help' | 'navigator_private';
  me: 'member' | 'navigator';
  title: string;
  subtitle: string;
  attachedTxnId?: string;
  reportProblem?: boolean;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const scroller = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const openedRef = useRef(false);

  const { data: thread } = useQuery({
    queryKey: ['thread', memberId, threadKind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('member_id', memberId)
        .eq('kind', threadKind)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', thread?.id],
    enabled: !!thread?.id,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('thread_id', thread!.id)
        .order('created_at');
      if (error) throw error;
      return data as unknown as ChatMessage[];
    },
  });

  // Realtime: both sides see the conversation as it happens.
  useEffect(() => {
    if (!thread?.id) return;
    const channel = supabase
      .channel(`chat:${thread.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${thread.id}` },
        () => qc.invalidateQueries({ queryKey: ['messages', thread.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.id, qc]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.rpc('send_chat_message', {
        p_member: memberId,
        p_kind: threadKind,
        p_body: body,
        p_txn_id: attachedTxnId ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', thread?.id] }),
  });

  const confirm = useMutation({
    mutationFn: async (args: { messageId: string; yes: boolean }) => {
      const { data, error } = await supabase.rpc('confirm_chat_action', {
        p_message: args.messageId,
        p_yes: args.yes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', thread?.id] });
      qc.invalidateQueries({ queryKey: ['member_home'] });
    },
  });

  // "Report a problem" opens this screen with the transaction attached and the
  // AI asking the opening question. No category sheet (Appendix A §6.2).
  useEffect(() => {
    if (!reportProblem || !attachedTxnId || !thread?.id || openedRef.current) return;
    openedRef.current = true;
    supabase
      .rpc('start_problem_report', { p_member: memberId, p_txn_id: attachedTxnId })
      .then(() => qc.invalidateQueries({ queryKey: ['messages', thread.id] }));
  }, [reportProblem, attachedTxnId, thread?.id, memberId, qc]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: color.screenBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[s.header, { paddingTop: 12 + insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={s.backCircle}
        >
          <Icon name="back" size={20} stroke={color.navy} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar icon="chat" bg={color.navy} fg="#fff" size={32} />
          <View style={{ marginLeft: -8 }}>
            <Avatar letter={subtitle.slice(0, 1).toUpperCase()} size={32} />
          </View>
        </View>

        <View style={{ flexShrink: 1 }}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>

        <View style={{ marginLeft: 'auto' }}>
          <Avatar icon="chat" bg="transparent" fg={color.navy} size={26} />
        </View>
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 18, gap: 14 }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {(messages ?? []).map((m) => (
          <Bubble
            key={m.id}
            message={m}
            mine={m.sender === me}
            navigatorName={subtitle}
            onConfirm={(yes) => confirm.mutate({ messageId: m.id, yes })}
          />
        ))}
      </ScrollView>

      <View style={[s.composer, { paddingBottom: 12 + insets.bottom }]}>
        <TextInput
          style={s.input}
          placeholder="Message"
          placeholderTextColor="#9aa7b6"
          value={draft}
          onChangeText={setDraft}
          multiline
          accessibilityLabel="Message"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Talk instead of typing"
          style={s.micButton}
          onPress={() => router.push('/(member)/chat-voice')}
        >
          <Icon name="mic" size={20} stroke={color.navy} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!draft.trim() || send.isPending}
          style={[s.sendButton, (!draft.trim() || send.isPending) && { opacity: 0.5 }]}
          onPress={() => {
            const body = draft.trim();
            if (!body) return;
            setDraft('');
            send.mutate(body);
          }}
        >
          <Icon name="send" size={20} stroke="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({
  message,
  mine,
  navigatorName,
  onConfirm,
}: {
  message: ChatMessage;
  mine: boolean;
  navigatorName: string;
  onConfirm: (yes: boolean) => void;
}) {
  if (message.sender === 'system') {
    return (
      <View style={s.systemPill}>
        <Text style={s.systemText}>{message.body}</Text>
      </View>
    );
  }

  if (mine) {
    return (
      <View style={s.mine}>
        <Text style={s.mineText}>{message.body}</Text>
      </View>
    );
  }

  const who = message.sender === 'ai' ? 'AI helper' : navigatorName;

  return (
    <View style={s.theirs}>
      {message.sender === 'ai' ? (
        <Avatar icon="chat" bg={color.navy} fg="#fff" size={32} />
      ) : (
        <Avatar letter={who.slice(0, 1).toUpperCase()} size={32} />
      )}
      <View style={{ flexShrink: 1 }}>
        <Text style={s.who}>{who}</Text>

        {message.action && message.action_status === 'pending' ? (
          <View style={s.actionCard}>
            <Text style={s.actionText}>{message.action.label}</Text>
            <View style={s.actionButtons}>
              <Pressable style={[s.actionBtn, { backgroundColor: color.gold }]} onPress={() => onConfirm(true)}>
                <Text style={[s.actionBtnText, { color: color.navy }]}>Yes</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, { backgroundColor: color.greyBtnBg }]} onPress={() => onConfirm(false)}>
                <Text style={[s.actionBtnText, { color: color.navy }]}>No</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.theirsBubble}>
            <Text style={s.theirsText}>{message.body}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.black, fontSize: 17, color: color.ink },
  subtitle: { fontFamily: font.bold, fontSize: 12, color: color.soft },

  mine: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: color.navy,
  },
  mineText: { color: '#fff', fontFamily: font.semibold, fontSize: 16, lineHeight: 23 },

  theirs: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', maxWidth: '86%' },
  who: { fontFamily: font.extrabold, fontSize: 12, color: color.soft, marginBottom: 3 },
  theirsBubble: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: '#fff',
  },
  theirsText: { color: color.ink, fontFamily: font.semibold, fontSize: 16, lineHeight: 23 },

  actionCard: {
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  actionText: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontFamily: font.semibold,
    fontSize: 16,
    color: color.ink,
  },
  actionButtons: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  actionBtnText: { fontFamily: font.extrabold, fontSize: 15 },

  systemPill: {
    alignSelf: 'center',
    backgroundColor: '#e3e9f1',
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  systemText: { fontFamily: font.bold, fontSize: 13, color: color.soft },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: font.semibold,
    color: color.ink,
    backgroundColor: color.screenBg,
    maxHeight: 120,
  },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.greyBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
