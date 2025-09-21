import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

type TicketRow = {
  id: string;
  user_id: string | null;
  category: string;
  status: string;
  priority: string;
  assigned_department: string | null;
  created_at: string;
};

type UpdateRow = {
  id: string;
  ticket_id: string;
  message: string | null;
  status: string | null;
  progress_percent: number | null;
  created_at: string;
};

export default function TrackProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [updates, setUpdates] = useState<Record<string, UpdateRow[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data: tks, error: tErr } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (tErr) throw tErr;
        if (!mounted) return;
        setTickets(tks || []);

        // Load updates grouped by ticket
        const ticketIds = (tks || []).map((t) => t.id);
        if (ticketIds.length) {
          const { data: ups, error: uErr } = await supabase
            .from('progress_updates')
            .select('*')
            .in('ticket_id', ticketIds)
            .order('created_at', { ascending: false });
          if (uErr) throw uErr;
          const grouped: Record<string, UpdateRow[]> = {};
          (ups || []).forEach((u) => {
            grouped[u.ticket_id] = grouped[u.ticket_id] || [];
            grouped[u.ticket_id].push(u);
          });
          if (!mounted) return;
          setUpdates(grouped);
        } else {
          setUpdates({});
        }
      } catch (e: any) {
        console.warn('Track load error:', e?.message || e);
        if (mounted) setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // Realtime subscription for updates
    const channel = supabase
      .channel('progress_updates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'progress_updates' },
        (payload) => {
          setUpdates((prev) => {
            const next = { ...prev };
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new as UpdateRow;
              const arr = next[row.ticket_id] ? [...next[row.ticket_id]] : [];
              // Prepend newest
              const filtered = arr.filter((u) => u.id !== row.id);
              next[row.ticket_id] = [row, ...filtered];
            } else if (payload.eventType === 'DELETE') {
              const row = payload.old as UpdateRow;
              const arr = next[row.ticket_id] ? [...next[row.ticket_id]] : [];
              next[row.ticket_id] = arr.filter((u) => u.id !== row.id);
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const totalInProgress = useMemo(
    () => tickets.filter((t) => (t.status || '').toLowerCase().includes('progress')).length,
    [tickets]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Track Progress</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tickets.length}</Text>
          <Text style={styles.statLabel}>Tickets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalInProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.keys(updates).length}</Text>
          <Text style={styles.statLabel}>With Updates</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text style={{ color: '#6b7280', marginTop: 8 }}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.errorText}>Failed to load realtime data. Check schema and RLS.</Text>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptyText}>Submit questions or suggestions to start tracking.</Text>
          </View>
        ) : (
          tickets.map((t) => {
            const last = (updates[t.id] || [])[0];
            const progress = last?.progress_percent ?? 0;
            return (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}> 
                    <Text style={[styles.badgeText, { color: '#2563eb' }]}>{t.category}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}> 
                    <Text style={[styles.badgeText, { color: '#d97706' }]}>{t.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>Ticket #{t.id.slice(0, 8)}</Text>
                <Text style={styles.cardSubtitle}>
                  {last?.message || 'Awaiting first update'}
                </Text>

                {/* Progress */}
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressLabel}>{progress}%</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {new Date(t.created_at).toLocaleString()}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#2563eb" />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  placeholder: { width: 40 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  loading: { alignItems: 'center', padding: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginVertical: 12,
  },
  errorText: { color: '#ef4444' },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginRight: 10 },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  progressLabel: { fontSize: 12, color: '#6b7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFooterText: { fontSize: 12, color: '#9ca3af' },
});
