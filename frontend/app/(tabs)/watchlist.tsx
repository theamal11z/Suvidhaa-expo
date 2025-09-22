import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

type WatchRow = { id: string; user_id: string | null; target_type: 'policy'|'ticket'; target_id: string; created_at: string };
type TicketRow = { id: string; category: string; status: string; created_at: string };
type UpdateRow = { id: string; ticket_id: string; message: string | null; progress_percent: number | null; created_at: string };

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watch, setWatch] = useState<WatchRow[]>([]);
  const [tickets, setTickets] = useState<Record<string, TicketRow>>({});
  const [latestUpdate, setLatestUpdate] = useState<Record<string, UpdateRow | null>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Ensure we only load the current user's personal watchlist
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const userId = authData?.user?.id;

        if (!userId) {
          if (!mounted) return;
          setWatch([]);
          setTickets({});
          setLatestUpdate({});
          return;
        }

        const { data: wl, error: wErr } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (wErr) throw wErr;
        if (!mounted) return;
        setWatch(wl || []);

        const ticketIds = (wl || []).filter(x => x.target_type === 'ticket').map(x => x.target_id);
        if (ticketIds.length) {
          const { data: tk, error: tErr } = await supabase
            .from('tickets')
            .select('*')
            .in('id', ticketIds);
          if (tErr) throw tErr;
          const map: Record<string, TicketRow> = {};
          (tk || []).forEach((t) => { map[t.id] = t as any; });
          if (!mounted) return;
          setTickets(map);

          // latest progress update per ticket
          const { data: ups, error: uErr } = await supabase
            .from('progress_updates')
            .select('*')
            .in('ticket_id', ticketIds)
            .order('created_at', { ascending: false });
          if (uErr) throw uErr;
          const latest: Record<string, UpdateRow | null> = {};
          (ups || []).forEach((u) => { if (!latest[u.ticket_id]) latest[u.ticket_id] = u as any; });
          if (!mounted) return;
          setLatestUpdate(latest);
        } else {
          setTickets({});
          setLatestUpdate({});
        }
      } catch (e: any) {
        console.warn('Watchlist load error:', e?.message || e);
        if (mounted) setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // Realtime on watchlist and progress updates
    const wlChan = supabase
      .channel('watchlist_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist' }, () => load())
      .subscribe();
    const updChan = supabase
      .channel('watch_updates_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress_updates' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(wlChan);
      supabase.removeChannel(updChan);
      mounted = false;
    };
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <Text style={styles.title}>Personal Watchlist</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{watch.length}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.keys(latestUpdate).length}</Text>
          <Text style={styles.statLabel}>Updates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.values(tickets).filter(t => t.status === 'resolved').length}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="sync" size={32} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning" size={32} color="#ef4444" />
            <Text style={styles.emptyTitle}>Failed to load</Text>
            <Text style={styles.emptyDescription}>{error}</Text>
          </View>
        ) : watch.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyDescription}>Add policies or tickets to your watchlist.</Text>
          </View>
        ) : (
          watch.map((w) => (
          <TouchableOpacity key={w.id} style={styles.itemCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemTitle}>
                {w.target_type === 'ticket' ? `Ticket #${(tickets[w.target_id]?.id || '').slice(0,8)}` : 'Policy'}
              </Text>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.typeContainer}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {w.target_type === 'ticket' ? `Category: ${tickets[w.target_id]?.category ?? 'N/A'}` : 'Policy'}
                </Text>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, latestUpdate[w.target_id]?.progress_percent ?? 0))}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.max(0, Math.min(100, latestUpdate[w.target_id]?.progress_percent ?? 0))}%</Text>
            </View>
            
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.statusText}>{tickets[w.target_id]?.status ?? 'Unknown'}</Text>
                <Text style={styles.updateText}>
                  Last update: {latestUpdate[w.target_id]?.created_at ? new Date(latestUpdate[w.target_id]!.created_at).toLocaleString() : '—'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#2563eb" />
            </View>
          </TouchableOpacity>
        ))
        )}
        
        {/* Call to action */}
        <View style={styles.emptyState}>
          <TouchableOpacity style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Browse Policies</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  updateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});