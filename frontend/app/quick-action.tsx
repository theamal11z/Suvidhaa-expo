import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function QuickActionScreen() {
  const router = useRouter();

  const quickActions = [
    {
      title: 'Emergency Services',
      icon: 'warning',
      color: '#ef4444',
      bgColor: '#fef2f2',
      actions: [
        { name: 'Police', number: '100', icon: 'shield' },
        { name: 'Fire Brigade', number: '101', icon: 'flame' },
        { name: 'Ambulance', number: '102', icon: 'medical' },
        { name: 'Disaster', number: '108', icon: 'alert-circle' },
      ],
    },
    {
      title: 'Citizen Services',
      icon: 'people',
      color: '#2563eb',
      bgColor: '#dbeafe',
      actions: [
        { name: 'File Complaint', route: '/file-complaint', icon: 'document-text' },
        { name: 'Track Application', route: '/track-progress', icon: 'search' },
        { name: 'Pay Bills', route: '/pay-bills', icon: 'card' },
        { name: 'Book Appointment', route: '/book-appointment', icon: 'calendar' },
      ],
    },
    {
      title: 'Information Center',
      icon: 'information-circle',
      color: '#10b981',
      bgColor: '#dcfce7',
      actions: [
        { name: 'Government Schemes', route: '/schemes', icon: 'gift' },
        { name: 'Office Locations', route: '/locations', icon: 'location' },
        { name: 'Contact Directory', route: '/directory', icon: 'call' },
        { name: 'FAQ', route: '/faq', icon: 'help-circle' },
      ],
    },
    {
      title: 'Popular Services',
      icon: 'star',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      actions: [
        { name: 'Aadhaar Services', route: '/aadhaar', icon: 'finger-print' },
        { name: 'PAN Services', route: '/pan', icon: 'card-outline' },
        { name: 'Passport', route: '/passport', icon: 'airplane' },
        { name: 'Driving License', route: '/license', icon: 'car-sport' },
      ],
    },
  ];

  const handleActionPress = (action: any) => {
    if (action.number) {
      // Handle emergency numbers (could integrate with phone dialer)
      console.log(`Calling ${action.number}`);
    } else if (action.route) {
      // Navigate to specific route
      router.push(action.route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Actions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="flash" size={48} color="#2563eb" />
          <Text style={styles.heroTitle}>Fast Access</Text>
          <Text style={styles.heroSubtitle}>
            Quick access to essential government services and emergency contacts
          </Text>
        </View>

        {/* Action Sections */}
        {quickActions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: section.bgColor }]}>
                <Ionicons name={section.icon as any} size={24} color={section.color} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            <View style={styles.actionsGrid}>
              {section.actions.map((action, actionIndex) => (
                <TouchableOpacity
                  key={actionIndex}
                  style={styles.actionCard}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: section.bgColor }]}>
                    <Ionicons name={action.icon as any} size={24} color={section.color} />
                  </View>
                  
                  <Text style={styles.actionTitle}>{action.name}</Text>
                  
                  {action.number && (
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>{action.number}</Text>
                    </View>
                  )}
                  
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={styles.actionArrow} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Emergency Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyIcon}>
            <Ionicons name="warning" size={24} color="#ffffff" />
          </View>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency?</Text>
            <Text style={styles.emergencyText}>
              In case of emergency, call 112 for immediate assistance
            </Text>
          </View>
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>Call 112</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Actions */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Actions</Text>
          
          <View style={styles.recentItem}>
            <View style={styles.recentIcon}>
              <Ionicons name="document-text" size={20} color="#6b7280" />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentActionTitle}>Filed complaint about road repair</Text>
              <Text style={styles.recentActionDate}>2 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.recentItem}>
            <View style={styles.recentIcon}>
              <Ionicons name="search" size={20} color="#6b7280" />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentActionTitle}>Checked passport application status</Text>
              <Text style={styles.recentActionDate}>1 day ago</Text>
            </View>
          </View>
          
          <View style={styles.recentItem}>
            <View style={styles.recentIcon}>
              <Ionicons name="call" size={20} color="#6b7280" />
            </View>
            <View style={styles.recentContent}>
              <Text style={styles.recentActionTitle}>Called citizen helpline</Text>
              <Text style={styles.recentActionDate}>3 days ago</Text>
            </View>
          </View>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  numberBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 12,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionArrow: {
    marginLeft: 8,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  emergencyButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  recentSection: {
    marginBottom: 40,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  recentActionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
});