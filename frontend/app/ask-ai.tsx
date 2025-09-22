import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrCreateConversation, listMessages, sendMessage, AIMessage, clearConversation } from '../lib/ai';
import { AIIntakeReply, generateIntakeReply } from '../lib/intake';

interface ChatMessageUI {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

function renderAssistantText(parsed: AIIntakeReply): string {
  if (parsed.mode === 'ask') {
    return [parsed.message, parsed.question].filter(Boolean).join(' ');
  }
  const steps = (parsed.steps || []).slice(0, 3);
  const lines = steps.map((s, i) => `${i + 1}. ${s}`);
  return [parsed.message, ...lines].filter(Boolean).join('\n');
}

export default function AskAIScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageUI[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const conv = await getOrCreateConversation('Assistant Chat');
        if (!mounted) return;
        setConversationId(conv.id);
        const msgs = await listMessages(conv.id);
        if (!mounted) return;
const mapped: ChatMessageUI[] = (msgs || []).map((m: AIMessage) => {
          let text = m.content;
          if (m.role !== 'user' && m.message_type === 'json') {
            try {
              const parsed = JSON.parse(m.content) as AIIntakeReply;
              if (parsed && parsed.mode && parsed.message) {
                text = renderAssistantText(parsed);
              }
            } catch {}
          }
          return {
            id: m.id,
            text,
            isUser: m.role === 'user',
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
        if (mapped.length === 0) {
          mapped.push({
            id: 'welcome',
text: 'Understood—tell me briefly what happened, when, and where.',
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
        setChatMessages(mapped);
      } catch (e) {
        // Fallback welcome message if schema not ready yet
        setChatMessages([{
          id: 'welcome',
          text: "Namaste! I'm your legal advisor and government services assistant for Nepal. I help Nepali citizens navigate government processes, understand policies, and handle legal documentation.\n\nI learn about you over time to provide personalized advice. To get started, could you tell me what you need help with today?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const quickQuestions = [
    'Help with Nepal e-passport application',
    'Explain Social Security Fund (SSF)',
    'How to get PAN in Nepal (IRD)?',
    'Driving license smart card process',
    'Citizenship certificate guidance',
    'Company registration at OCR',
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage('');
    const uiMsg: ChatMessageUI = {
      id: `local-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, uiMsg]);
    setIsTyping(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await getOrCreateConversation('Assistant Chat');
        convId = conv.id;
        setConversationId(convId);
      }
      // Persist user message
      await sendMessage(convId!, text);
// Generate concise intake reply (JSON) and persist
      const { parsed, saved } = await generateIntakeReply(convId!, text);
      const uiReply: ChatMessageUI = {
        id: saved.id,
        text: renderAssistantText(parsed),
        isUser: false,
        timestamp: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, uiReply]);
    } catch (e) {
      console.error('AI Assistant Error:', e);
      setChatMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        text: 'I apologize, but I\'m having trouble connecting to my knowledge base right now. Please try asking your question again, or contact support if the issue persists.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
      // Auto-scroll
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // Static fallback logic removed in favor of real LLM reply

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  const handleClearChat = async () => {
    if (!conversationId) {
      // Nothing to clear; just reset UI
        setChatMessages([{
          id: 'welcome',
text: 'Understood—tell me briefly what happened, when, and where.',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      return;
    }

    Alert.alert(
      'Clear chat?',
      'This will delete all messages in this conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsTyping(true);
              await clearConversation(conversationId);
              setChatMessages([{
                id: 'welcome',
text: 'Understood—tell me briefly what happened, when, and where.',
                isUser: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }]);
            } catch (e) {
              console.error('Clear chat failed', e);
              Alert.alert('Failed to clear', 'Please try again.');
            } finally {
              setIsTyping(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Nepal Government Services Helper</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.menuButton} onPress={handleClearChat}>
            <Ionicons name="trash" size={20} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/ai-memory' as any)}>
            <Ionicons name="sparkles" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
          ref={scrollRef}
        >
          {chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.isUser ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              {!msg.isUser && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={20} color="#ffffff" />
                </View>
              )}
              
              <View
                style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {msg.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  msg.isUser ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                  {msg.timestamp}
                </Text>
              </View>
              
              {msg.isUser && (
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={16} color="#ffffff" />
                </View>
              )}
            </View>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={20} color="#ffffff" />
              </View>
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions */}
        {chatMessages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
placeholder="Briefly share what happened, when, and where"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!message.trim() || isTyping}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={message.trim() ? "#ffffff" : "#d1d5db"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 6,
  },
  aiMessage: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#374151',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9ca3af',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
    marginHorizontal: 1,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  quickQuestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#374151',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
});