import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { getUnreadCount } from '../notifications';

export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn('Error fetching notification count:', err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up real-time subscription for notification changes
    const channel = supabase
      .channel('notifications_count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount
  };
}