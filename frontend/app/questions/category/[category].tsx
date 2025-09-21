import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listQuestionsByCategory } from '../../../lib/qa';

export default function QuestionsByCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{ id: string; text: string; status: string; created_at: string; category?: string | null }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!category) return;
        const rows = await listQuestionsByCategory(String(category));
        if (!mounted) return;
        setItems(rows);
      } catch (e) {
        console.error('Failed to load category questions', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [category]);

  const statusColors = (status: string) => {
    if (status === 'answered') return { bg: '#dcfce7', fg: '#16a34a' };
    if (status === 'open') return { bg: '#fef3c7', fg: '#d97706' };
    return { bg: '#e5e7eb', fg: '#6b7280' };
  };

  const titleCase = (s: string) => s.replace(/-/g, ' ') .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{category ? titleCase(String(category)) : 'Category'}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#9ca3af" />
          <Text style={styles.emptyText}>No questions found in this category</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {items.map(item => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push(`/question/${item.id}` as any)}>
              <View style={styles.rowBetween}>
                <View style={[styles.statusBadge, { backgroundColor: statusColors(item.status).bg }] }>
                  <Text style={[styles.statusText, { color: statusColors(item.status).fg }]}>{item.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.questionText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
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
  emptyBox: { alignItems: 'center', padding: 20, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#f9fafb', margin: 20 },
  emptyText: { marginTop: 8, color: '#6b7280' },
  card: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginHorizontal: 20, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: '#9ca3af' },
  questionText: { fontSize: 14, color: '#111827', lineHeight: 20 },
});
