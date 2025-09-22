import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { createTicketWithAttachments } from '../lib/tickets';
import { uploadToCloudinary } from '../lib/cloudinary';

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
  type LocalAttachment = { uri: string; name?: string; type?: string; size?: number; status?: 'pending'|'uploading'|'done'|'error'; uploadedUrl?: string; error?: string };
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const isAllowedType = (mime?: string) => {
    if (!mime) return true; // allow if unknown
    return mime === 'application/pdf' || mime.startsWith('image/');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing info', 'Please provide both title and description.');
      return;
    }

    // Validate files
    for (const f of attachments) {
      if (f.size && f.size > MAX_SIZE) {
        Alert.alert('File too large', `${f.name || 'Attachment'} exceeds 10MB.`);
        return;
      }
      if (!isAllowedType(f.type)) {
        Alert.alert('Unsupported file', `${f.name || 'Attachment'} type is not supported. Use images or PDF.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setUploading(true);

      // Upload sequentially to simplify error handling
      const results: { url: string; mime_type?: string | null; size?: number | null }[] = [];
      for (let i = 0; i < attachments.length; i++) {
        const f = attachments[i];
        try {
          // mark uploading
          setAttachments(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'uploading', error: undefined } : a));
          const res = await uploadToCloudinary({ uri: f.uri, name: f.name, type: f.type }, { folder: 'tickets' });
          results.push({ url: res.secure_url, mime_type: f.type ?? null, size: f.size ?? null });
          setAttachments(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'done', uploadedUrl: res.secure_url } : a));
        } catch (e: any) {
          console.error('Upload failed:', e);
          setAttachments(prev => prev.map((a, idx) => idx === i ? { ...a, status: 'error', error: e?.message ?? 'Upload failed' } : a));
          Alert.alert('Upload failed', e?.message ?? 'Could not upload one of the attachments');
          return;
        }
      }

      // Create ticket and save attachment rows (if table exists)
      await createTicketWithAttachments({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        location: location.trim() || null,
      }, results);

      Alert.alert('Submitted', 'Your complaint has been submitted.', [
        { text: 'OK', onPress: () => router.push('/track-progress') },
      ]);

      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('grievance');
      setPriority('medium');
      setAttachments([]);
    } catch (e: any) {
      Alert.alert('Submission failed', e?.message ?? 'Unknown error');
    } finally {
      setUploading(false);
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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>File a Complaint</Text>
          <Text style={styles.subtitle}>Report issues with Nepal government services</Text>
        </View>
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
            placeholder="Municipality, District (e.g., Lalitpur, Bagmati)"
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Attachments */}
        <View style={styles.field}>
          <Text style={styles.label}>Attachments (optional)</Text>

          {attachments.length > 0 && (
            <View style={styles.attachmentsGrid}>
              {attachments.map((a, idx) => {
                const isImage = (a.type || '').startsWith('image/');
                return (
                  <View key={`${idx}-${a.uri}`} style={styles.attachmentItem}>
                    <View style={styles.attachmentThumb}>
                      {isImage ? (
                        <Image source={{ uri: a.uri }} style={styles.attachmentImage} />
                      ) : (
                        <View style={styles.docIconBox}>
                          <Ionicons name="document" size={20} color="#2563eb" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.attachmentName} numberOfLines={1}>{a.name || 'file'}</Text>
                    <View style={styles.attachmentRow}>
                      {!!a.size && <Text style={styles.attachmentMeta}>{Math.ceil(a.size / 1024)} KB</Text>}
                      {a.status === 'uploading' && <Text style={styles.attachmentUploading}>Uploading…</Text>}
                      {a.status === 'error' && <Text style={styles.attachmentError}>Failed</Text>}
                    </View>
                    <TouchableOpacity style={styles.removeAttachment} onPress={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="close" size={14} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.attachButton}
            onPress={async () => {
              const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
              if (res.canceled) return;
              const files = res.assets || [];
              const sanitized = files.map(f => ({ uri: f.uri, name: f.name, type: f.mimeType || undefined, size: f.size, status: 'pending' as const }));
              setAttachments(prev => [...prev, ...sanitized]);
            }}
          >
            <Ionicons name="attach" size={20} color="#2563eb" />
            <Text style={styles.attachText}>Attach files (PDF, images, etc.)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (submitting || uploading) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting || uploading}
        >
          <Ionicons name="send" size={20} color="#ffffff" />
          <Text style={styles.submitText}>{uploading ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit Complaint'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
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
  // Attachments grid
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  attachmentItem: { width: 120, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 8, backgroundColor: '#f8fafc', position: 'relative' },
  attachmentThumb: { height: 64, borderRadius: 8, overflow: 'hidden', backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  attachmentImage: { width: '100%', height: '100%' },
  docIconBox: { alignItems: 'center', justifyContent: 'center', height: '100%' },
  attachmentName: { maxWidth: '100%', color: '#111827', fontWeight: '600', marginTop: 6 },
  attachmentMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attachmentUploading: { color: '#2563eb', fontSize: 12 },
  attachmentError: { color: '#ef4444', fontSize: 12 },
  removeAttachment: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ffffff', borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  // Single attach button
  attachButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 12 },
  attachText: { color: '#2563eb', marginLeft: 8, fontWeight: '600' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, marginTop: 8, marginBottom: 24 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontWeight: '600', marginLeft: 8 },
});
