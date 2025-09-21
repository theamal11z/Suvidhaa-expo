import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getQuestionWithAnswers } from '../../lib/qa';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<null | { id: string; text: string; status: string; created_at: string }>(null);
  const [answers, setAnswers] = useState<Array<{ id: string; answer_text: string; source_type: string; verified: boolean; helpful_votes: number; created_at: string }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getQuestionWithAnswers(String(id));
        if (!mounted) return;
        setQ(data.question);
        setAnswers(data.answers);
      } catch (e) {
        console.error('Failed to load question detail', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const statusColors = (status: string) => {
    if (status === 'answered') return { bg: '#dcfce7', fg: '#16a34a' };
    if (status === 'open') return { bg: '#fef3c7', fg: '#d97706' };
    return { bg: '#e5e7eb', fg: '#6b7280' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Question Detail</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : !q ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Question not found</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors(q.status).bg }] }>
                <Text style={[styles.statusText, { color: statusColors(q.status).fg }]}>{q.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(q.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.questionText}>{q.text}</Text>
          </View>

          <Text style={styles.sectionTitle}>Answers</Text>

          {answers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#9ca3af" />
              <Text style={styles.emptyText}>No answers yet</Text>
            </View>
          ) : (
            answers.map((a) => (
              <View key={a.id} style={styles.answerCard}>
                <View style={styles.answerHeader}>
                  <View style={styles.answerMeta}>
                    <Ionicons name={a.source_type === 'ai' ? 'sparkles' : 'person'} size={16} color="#6b7280" />
                    <Text style={styles.answerMetaText}>{a.source_type.toUpperCase()}</Text>
                    {a.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.dateText}>{new Date(a.created_at).toLocaleString()}</Text>
                </View>
                <Text style={styles.answerText}>{a.answer_text}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  placeholder: { width: 40 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  card: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: '#9ca3af' },
  questionText: { fontSize: 16, color: '#111827', lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginVertical: 16 },
  emptyBox: { alignItems: 'center', padding: 20, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb' },
  emptyText: { marginTop: 8, color: '#6b7280' },
  answerCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  answerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerMetaText: { fontSize: 12, color: '#6b7280', marginLeft: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: '#ecfdf5', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { fontSize: 11, color: '#16a34a', marginLeft: 4 },
  answerText: { fontSize: 14, color: '#374151', lineHeight: 20 },
});
