import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { logoutUser } from '../../utils/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [language, setLanguage] = useState<string>('English');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // User statistics
  const [userStats, setUserStats] = useState({
    queries: 0,
    resolved: 0,
    policies: 0
  });

  const profileSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Edit Profile', action: () => router.push('/edit-profile') },
        { icon: 'shield-outline', title: 'Privacy & Security', action: () => router.push('/privacy-security') },
        { icon: 'card-outline', title: 'Payment Methods', action: () => router.push('/payment-methods') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: 'notifications-outline', 
          title: 'Notifications', 
          hasSwitch: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        { 
          icon: 'moon-outline', 
          title: 'Dark Mode', 
          hasSwitch: true,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled,
        },
        { icon: 'language-outline', title: 'Language', subtitle: language, action: () => router.push('/language') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help & FAQ', action: () => router.push('/help-faq') },
        { icon: 'chatbubble-outline', title: 'Contact Support', action: () => router.push('/contact-support') },
        { icon: 'star-outline', title: 'Rate App', action: () => router.push('/rate-app') },
      ],
    },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get user basic info
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setUserEmail(user?.email ?? null);
      // @ts-ignore metadata
      setUserName((user?.user_metadata as any)?.full_name ?? null);

      if (user) {
        // Fetch user statistics
        const [questionsResult, ticketsResult, watchlistResult] = await Promise.allSettled([
          supabase.from('questions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'resolved'),
          supabase.from('watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('target_type', 'policy')
        ]);

        setUserStats({
          queries: questionsResult.status === 'fulfilled' ? (questionsResult.value.count || 0) : 0,
          resolved: ticketsResult.status === 'fulfilled' ? (ticketsResult.value.count || 0) : 0,
          policies: watchlistResult.status === 'fulfilled' ? (watchlistResult.value.count || 0) : 0
        });

        // Fetch profile location
        try {
          const { data: profileRow } = await supabase
            .from('user_profiles')
            .select('location')
            .eq('user_id', user.id)
            .maybeSingle();
          setUserLocation((profileRow as any)?.location ?? null);
        } catch (e) {
          // ignore
        }

        // Fetch preferred language from AI memory if available
        try {
          const { data: langRow } = await supabase
            .from('ai_memory')
            .select('value')
            .eq('user_id', user.id)
            .eq('key', 'app_language')
            .maybeSingle();
          const v = (langRow as any)?.value;
          if (v) {
            const label = typeof v === 'string' ? v : (v.label || v.code || 'English');
            setLanguage(label);
          }
        } catch (e) {
          // ignore preference fetch errors
        }
      }
    } catch (error) {
      console.warn('Error fetching user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Navigation handled by auth listener in _layout
    } catch (error: any) {
      setIsLoggingOut(false);
      Alert.alert(
        'Logout Failed',
        error?.message || 'Failed to logout. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/privacy-security')}>
          <Ionicons name="settings-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                 userEmail ? userEmail.substring(0, 2).toUpperCase() : 'C'}
              </Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName ?? 'Citizen'}</Text>
            {userEmail ? (
              <Text style={styles.userEmail}>{userEmail}</Text>
            ) : null}
            {userLocation ? (
              <Text style={styles.userLocation}>📍 {userLocation}</Text>
            ) : null}
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Ionicons name="create-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.queries}</Text>
            <Text style={styles.statLabel}>Queries Raised</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.resolved}</Text>
            <Text style={styles.statLabel}>Issues Resolved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.policies}</Text>
            <Text style={styles.statLabel}>Policies Tracked</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={item.action}
                disabled={item.hasSwitch}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={22} color="#6b7280" />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.menuRight}>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                      thumbColor={item.value ? '#2563eb' : '#f3f4f6'}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <ActivityIndicator size="small" color="#ef4444" />
              <Text style={[styles.logoutText, styles.loggingOutText]}>Logging out...</Text>
            </>
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Suvidhaa v1.0.0</Text>
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
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  editButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  menuRight: {
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  loggingOutText: {
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
