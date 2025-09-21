import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function AskAIScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: 'Hello! I\'m your AI assistant for government services. I can help you understand policies, find information, and guide you through various government processes. What would you like to know?',
      isUser: false,
      timestamp: '10:30 AM',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    'How to apply for passport?',
    'What are the benefits of Ayushman Bharat?',
    'How to register for GST?',
    'What is the process for PAN card?',
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      text: message,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        text: getAIResponse(message),
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('passport')) {
      return 'To apply for a passport:\n\n1. Visit the Passport Seva website (passportindia.gov.in)\n2. Register and fill the online application\n3. Pay the fee online\n4. Book an appointment at PSK/PSP\n5. Visit with required documents\n\nRequired documents:\n• Proof of address\n• Proof of date of birth\n• Identity proof\n\nProcessing time: 30-45 days for normal processing, 7-15 days for Tatkal.';
    }
    
    if (lowerMessage.includes('ayushman') || lowerMessage.includes('health')) {
      return 'Ayushman Bharat provides:\n\n• Free health insurance up to ₹5 lakh per family per year\n• Coverage for 1,400+ medical packages\n• Cashless treatment at empaneled hospitals\n• Pre and post-hospitalization expenses covered\n\nEligibility is based on SECC 2011 data. You can check your eligibility at mera.pmjay.gov.in or visit Common Service Centers.';
    }
    
    if (lowerMessage.includes('gst')) {
      return 'GST Registration process:\n\n1. Visit the GST portal (gst.gov.in)\n2. Fill Form GST REG-01\n3. Upload required documents\n4. Verify through Aadhaar/EVC\n5. Submit application\n\nRequired documents:\n• PAN card\n• Aadhaar card\n• Business registration proof\n• Bank account details\n• Digital signature (if applicable)\n\nRegistration is mandatory for businesses with turnover > ₹20 lakh (₹10 lakh for NE states).';
    }
    
    return 'I understand you\'re asking about government services. While I don\'t have specific information about that topic right now, I recommend:\n\n1. Visiting the official government portal (india.gov.in)\n2. Checking your state government website\n3. Visiting the nearest Common Service Center\n4. Calling the citizen helpline: 14444\n\nIs there anything else I can help you with regarding government policies or services?';
  };

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Government Services Helper</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
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
                  <Ionicons name="robot" size={20} color="#ffffff" />
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
                <Ionicons name="robot" size={20} color="#ffffff" />
              </View>
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                  <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
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
              placeholder="Ask me anything about government services..."
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