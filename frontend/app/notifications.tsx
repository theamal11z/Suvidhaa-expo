import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listNotifications, markRead, Notification } from '../lib/notifications';
import { supabase } from '../lib/supabase';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listNotifications(100);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    load();
    const chan = supabase
      .channel('notifications_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(chan);
      mounted = false;
    };
  }, []);

  const toggleRead = async (id: string, read: boolean) => {
    try {
      await markRead(id, !read);
      await load();
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <Text style={[styles.hint, { color: '#ef4444' }]}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {items.map((n) => (
            <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: '#e5f3ff' }]}>
                  <Text style={[styles.badgeText, { color: '#2563eb' }]}>{n.type || 'update'}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleRead(n.id, n.read)}>
                  <Ionicons name={n.read ? 'mail-open-outline' : 'mail-unread-outline'} size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitle}>{n.title || 'Notification'}</Text>
              {n.body ? <Text style={styles.cardSubtitle}>{n.body}</Text> : null}
              <Text style={styles.time}>{new Date(n.created_at).toLocaleString()}</Text>
            </View>
          ))}
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
  center: { padding: 20, alignItems: 'center' },
  hint: { color: '#6b7280', padding: 16, textAlign: 'center' },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardUnread: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: '#6b7280' },
  time: { marginTop: 8, fontSize: 12, color: '#9ca3af' },
});
