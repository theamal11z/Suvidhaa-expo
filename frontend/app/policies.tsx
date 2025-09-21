import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listPolicies, Policy } from '../lib/policies';

export default function PoliciesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await listPolicies({ search: search.trim() || undefined, limit: 100 });
        if (!mounted) return;
        setPolicies(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load policies');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [search]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Policies</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search policies..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.hint}>Loading…</Text>
        ) : error ? (
          <Text style={[styles.hint, { color: '#ef4444' }]}>{error}</Text>
        ) : policies.length === 0 ? (
          <Text style={styles.hint}>No policies found.</Text>
        ) : (
          policies.map((p) => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push({ pathname: '/policy/[id]', params: { id: p.id } })}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}><Text style={styles.badgeText}>{p.category || 'General'}</Text></View>
                <View style={[styles.badge, { backgroundColor: '#e5f3ff' }]}><Text style={[styles.badgeText, { color: '#2563eb' }]}>{p.status || 'active'}</Text></View>
              </View>
              <Text style={styles.cardTitle}>{p.title}</Text>
              {p.summary ? <Text style={styles.cardSubtitle} numberOfLines={3}>{p.summary}</Text> : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  backButton: { padding: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', height: 44, marginBottom: 12 },
  searchInput: { marginLeft: 8, flex: 1, color: '#111827' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  hint: { color: '#6b7280', padding: 16, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, color: '#374151' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: '#6b7280' },
});
