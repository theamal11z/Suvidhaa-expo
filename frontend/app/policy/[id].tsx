import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPolicy, listPolicyUpdates, Policy, PolicyUpdate } from '../../lib/policies';
import { addToWatchlist, removeIfExists } from '../../lib/watchlist';

export default function PolicyDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [updates, setUpdates] = useState<PolicyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        if (!id) return;
        const p = await getPolicy(String(id));
        const u = await listPolicyUpdates(String(id));
        if (!mounted) return;
        setPolicy(p);
        setUpdates(u);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load policy');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  const toggleWatch = async () => {
    if (!id) return;
    setWatching(true);
    try {
      await removeIfExists('policy', String(id));
      await addToWatchlist('policy', String(id));
    } catch (e) {
      // no-op
    } finally {
      setWatching(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Policy</Text>
        <TouchableOpacity onPress={toggleWatch} style={styles.watchButton} disabled={watching}>
          <Ionicons name="bookmark" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <Text style={[styles.hint, { color: '#ef4444' }]}>{error}</Text>
      ) : !policy ? (
        <Text style={styles.hint}>Not found</Text>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}><Text style={styles.badgeText}>{policy.category || 'General'}</Text></View>
              <View style={[styles.badge, { backgroundColor: '#e5f3ff' }]}><Text style={[styles.badgeText, { color: '#2563eb' }]}>{policy.status || 'active'}</Text></View>
            </View>
            <Text style={styles.cardTitle}>{policy.title}</Text>
            {policy.summary ? <Text style={styles.cardSubtitle}>{policy.summary}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>Updates</Text>
          {updates.length === 0 ? (
            <Text style={styles.hint}>No updates yet.</Text>
          ) : (
            updates.map((u) => (
              <View key={u.id} style={styles.updateCard}>
                <Text style={styles.updateTitle}>{u.title || 'Update'}</Text>
                {u.effective_at ? <Text style={styles.updateTime}>{new Date(u.effective_at).toLocaleString()}</Text> : null}
                {u.body ? <Text style={styles.updateBody}>{u.body}</Text> : null}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { padding: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  watchButton: { padding: 8 },
  center: { padding: 20, alignItems: 'center' },
  hint: { color: '#6b7280', padding: 16, textAlign: 'center' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, color: '#374151' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6b7280' },
  updateCard: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10 },
  updateTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  updateTime: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  updateBody: { fontSize: 13, color: '#374151', lineHeight: 18 },
});
