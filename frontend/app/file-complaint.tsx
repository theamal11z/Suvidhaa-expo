import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createTicket } from '../lib/tickets';

const CATEGORIES = ['grievance', 'service', 'infrastructure', 'policy'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function FileComplaintScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('grievance');
  const [priority, setPriority] = useState('medium');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing info', 'Please provide both title and description.');
      return;
    }
    try {
      setSubmitting(true);
      const row = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: location.trim() || null,
      });
      Alert.alert('Submitted', 'Your complaint has been submitted.', [
        { text: 'OK', onPress: () => router.push('/track-progress') },
      ]);
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('grievance');
      setPriority('medium');
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>File Complaint</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Briefly describe the issue"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Provide details and any references"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.choicesRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.choice, category === c && styles.choiceActive]} onPress={() => setCategory(c)}>
                <Text style={[styles.choiceText, category === c && styles.choiceTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.choicesRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity key={p} style={[styles.choice, priority === p && styles.choiceActive]} onPress={() => setPriority(p)}>
                <Text style={[styles.choiceText, priority === p && styles.choiceTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="City, District, etc."
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && styles.submitDisabled]} onPress={handleSubmit} disabled={submitting}>
          <Ionicons name="send" size={20} color="#ffffff" />
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Complaint'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { padding: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  textarea: { minHeight: 120 },
  choicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  choiceActive: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
  choiceText: { color: '#374151', textTransform: 'capitalize' },
  choiceTextActive: { color: '#1d4ed8' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, marginTop: 8, marginBottom: 24 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontWeight: '600', marginLeft: 8 },
});
