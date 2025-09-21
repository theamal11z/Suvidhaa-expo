import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const actionCards = [
    {
      title: 'Understand',
      icon: 'document-text',
      color: '#dbeafe',
      iconColor: '#2563eb',
      route: '/understand',
    },
    {
      title: 'Ask & Suggest',
      icon: 'create',
      color: '#f3f4f6',
      iconColor: '#6b7280',
      route: '/ask-suggest',
    },
    {
      title: 'Track Progress',
      icon: 'eye',
      color: '#dcfce7',
      iconColor: '#16a34a',
      route: '/track-progress',
    },
    {
      title: 'Ask AI',
      icon: 'chatbubble',
      color: '#fef3c7',
      iconColor: '#d97706',
      route: '/ask-ai',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}, Citizen!</Text>
          <Text style={styles.subtitle}>How can we help you today?</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.notificationBadge}>
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>5</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Cards */}
      <View style={styles.cardsContainer}>
        {actionCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionCard, { backgroundColor: card.color }]}
            onPress={() => router.push(card.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <Ionicons name={card.icon as any} size={32} color={card.iconColor} />
              <Text style={[styles.cardTitle, { color: card.iconColor }]}>{card.title}</Text>
              <Ionicons name="arrow-forward" size={20} color={card.iconColor} style={styles.cardArrow} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Ask or search for anything</Text>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/quick-action')}>
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="home" size={24} color="#2563eb" />
          <Text style={[styles.navText, { color: '#2563eb' }]}>Home</Text>
        </View>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/login')}>
          <Ionicons name="document-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Policies</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/onboarding')}>
          <Ionicons name="bookmark-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/splash')}>
          <Ionicons name="person-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  headerRight: {
    marginTop: 8,
  },
  notificationBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionCard: {
    width: (width - 60) / 2,
    height: 140,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  cardArrow: {
    alignSelf: 'flex-end',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9ca3af',
  },
  micButton: {
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    // Active styles can be added here
  },
  navText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
