import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TestHomeScreen() {
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

      {/* Bottom Navigation Simulation */}
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Ionicons name="home" size={24} color="#2563eb" />
          <Text style={[styles.navText, { color: '#2563eb' }]}>Home</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="document-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Policies</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="bookmark-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Watchlist</Text>
        </View>
        <View style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#9ca3af" />
          <Text style={styles.navText}>Profile</Text>
        </View>
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
    marginBottom: 40,
  },
  actionCard: {
    width: '48%',
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
  navText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});