import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createTicket } from '../lib/tickets';

export default function ContactSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '' });

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      Alert.alert('Validation', 'Please fill in subject and message');
      return;
    }
    setLoading(true);
    try {
      await createTicket({
        category: 'inquiry',
        title: form.subject.trim(),
        description: form.message.trim(),
        priority: 'medium',
        source_type: 'mobile-app',
      });
      Alert.alert('Sent', 'Your message has been sent to support');
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Support</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.iconButton} disabled={loading}>
          <Ionicons name="send" size={22} color={loading ? '#9ca3af' : '#2563eb'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.section}>
          <Text style={styles.label}>Subject</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Briefly describe your issue"
              value={form.subject}
              onChangeText={(t) => setForm(v => ({ ...v, subject: t }))}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Message</Text>
          <View style={[styles.inputContainer, { height: 140, alignItems: 'flex-start', paddingTop: 12 }] }>
            <Ionicons name="document-text" size={20} color="#9ca3af" style={[styles.inputIcon, { marginTop: 2 }]} />
            <TextInput
              style={[styles.input, { height: 120 } ]}
              placeholder="Provide more details so we can help"
              value={form.message}
              onChangeText={(t) => setForm(v => ({ ...v, message: t }))}
              placeholderTextColor="#9ca3af"
              multiline
            />
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send to Support'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  iconButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { paddingHorizontal: 16 },
  section: { marginTop: 16 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 6, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, color: '#111827' },
  primaryButton: { marginTop: 20, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
});