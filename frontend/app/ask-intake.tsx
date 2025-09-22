import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { AIMessage, listMessages, sendMessage } from '../lib/ai';
import { AIIntakeReply, generateIntakeReply } from '../lib/intake';

function renderAssistantText(parsed: AIIntakeReply): string {
  if (parsed.mode === 'ask') {
    return [parsed.message, parsed.question].filter(Boolean).join(' ');
  }
  const steps = (parsed.steps || []).slice(0, 3);
  const lines = steps.map((s, i) => `${i + 1}. ${s}`);
  return [parsed.message, ...lines].filter(Boolean).join('\n');
}

export default function AskIntakeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chat, setChat] = useState<{ id: string; text: string; isUser: boolean; ts: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Reuse last intake conversation or create one
        const { data: existing, error: findErr } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('title', 'Intake Assistant')
          .order('updated_at', { ascending: false })
          .limit(1);
        if (findErr) throw findErr;

        let convId: string | null = existing && existing.length > 0 ? existing[0].id : null;
        if (!convId) {
          const { data: created, error: cErr } = await supabase
            .from('ai_conversations')
            .insert({ title: 'Intake Assistant', context_type: 'intake' })
            .select('*')
            .single();
          if (cErr) throw cErr;
          convId = created.id;
        }
        if (!mounted) return;
        setConversationId(convId!);

        const msgs = await listMessages(convId!);
        if (!mounted) return;
        const mapped = (msgs || []).map((m: AIMessage) => {
          let text = m.content;
          // Try to render JSON intake messages nicely
          try {
            const parsed = JSON.parse(m.content) as AIIntakeReply;
            if (parsed && parsed.mode && parsed.message) {
              text = renderAssistantText(parsed);
            }
          } catch {}
          return {
            id: m.id,
            text,
            isUser: m.role === 'user',
            ts: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        if (mapped.length === 0) {
          mapped.push({
            id: 'welcome',
            text: 'Understood—tell me briefly what happened, when, and where.',
            isUser: false,
            ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
        setChat(mapped);
      } catch (e) {
        setChat([{
          id: 'welcome',
          text: 'Understood—tell me briefly what happened, when, and where.',
          isUser: false,
          ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onSend = async () => {
    if (!message.trim() || !conversationId) return;
    const text = message.trim();
    setMessage('');
    const uiUser = { id: `u-${Date.now()}`, text, isUser: true, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChat(prev => [...prev, uiUser]);
    setIsTyping(true);
    try {
      await sendMessage(conversationId, text);
      const { parsed, saved } = await generateIntakeReply(conversationId, text);
      const uiAi = {
        id: saved.id,
        text: renderAssistantText(parsed),
        isUser: false,
        ts: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChat(prev => [...prev, uiAi]);
      // Touch conversation updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString(), title: 'Intake Assistant', context_type: 'intake' })
        .eq('id', conversationId);
    } catch (e) {
      console.error('Intake Assistant Error:', e);
      setChat(prev => [...prev, {
        id: `err-${Date.now()}`,
        text: "Sorry—couldn't process that. Could you share what happened, when, and where?",
        isUser: false,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Intake Assistant</Text>
          <Text style={styles.subtitle}>Short, focused guidance</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.menuButton} onPress={async () => {
            if (!conversationId) return;
            Alert.alert('Clear chat?', 'This will delete all messages in this intake conversation.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: async () => {
                try {
                  await supabase.from('ai_messages').delete().eq('conversation_id', conversationId);
                  setChat([{ id: 'welcome', text: 'Understood—tell me briefly what happened, when, and where.', isUser: false, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                } catch (e) {
                  Alert.alert('Failed to clear', 'Please try again.');
                }
              }}
            ]);
          }}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} ref={scrollRef} showsVerticalScrollIndicator={false}>
          {chat.map((m) => (
            <View key={m.id} style={[styles.messageContainer, m.isUser ? styles.userRow : styles.aiRow]}>
              {!m.isUser && (
                <View style={styles.aiAvatar}><Ionicons name="sparkles" size={20} color="#fff" /></View>
              )}
              <View style={[styles.bubble, m.isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.text, m.isUser ? styles.userText : styles.aiText]}>{m.text}</Text>
              </View>
              {m.isUser && (
                <View style={styles.userAvatar}><Ionicons name="person" size={16} color="#fff" /></View>
              )}
            </View>
          ))}
          {isTyping && (
            <View style={[styles.messageContainer, styles.aiRow]}>
              <View style={styles.aiAvatar}><Ionicons name="sparkles" size={20} color="#fff" /></View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <View style={styles.typing}><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Briefly share what happened, when, and where"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={300}
            />
            <TouchableOpacity style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]} disabled={!message.trim() || isTyping} onPress={onSend}>
              <Ionicons name="send" size={20} color={message.trim() ? '#fff' : '#d1d5db'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { padding: 8 },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1, paddingHorizontal: 20 },
  messagesContent: { paddingTop: 20, paddingBottom: 20 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  aiBubble: { backgroundColor: '#f3f4f6', borderTopLeftRadius: 6 },
  userBubble: { backgroundColor: '#2563eb', borderTopRightRadius: 6 },
  text: { fontSize: 14, lineHeight: 20 },
  aiText: { color: '#111827' },
  userText: { color: '#fff' },
  typing: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9ca3af' },
  inputBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f9fafb', borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, color: '#111827', paddingHorizontal: 8, paddingVertical: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: '#e5e7eb' },
});
