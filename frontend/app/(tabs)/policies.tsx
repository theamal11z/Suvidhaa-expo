import React from 'react';
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

const mockPolicies = [
  {
    id: 1,
    title: 'Digital India Initiative',
    description: 'Government program to transform India digitally',
    status: 'Active',
    category: 'Technology',
    date: '2024-01-15',
  },
  {
    id: 2,
    title: 'Pradhan Mantri Awas Yojana',
    description: 'Housing for all by 2024',
    status: 'Under Review',
    category: 'Housing',
    date: '2024-01-10',
  },
  {
    id: 3,
    title: 'Swachh Bharat Mission',
    description: 'Clean India campaign for sanitation',
    status: 'Active',
    category: 'Environment',
    date: '2024-01-05',
  },
];

export default function PoliciesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Government Policies</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {mockPolicies.map((policy) => (
          <TouchableOpacity key={policy.id} style={styles.policyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{policy.category}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: policy.status === 'Active' ? '#dcfce7' : '#fef3c7' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: policy.status === 'Active' ? '#16a34a' : '#d97706' }
                ]}>
                  {policy.status}
                </Text>
              </View>
            </View>
            
            <Text style={styles.policyTitle}>{policy.title}</Text>
            <Text style={styles.policyDescription}>{policy.description}</Text>
            
            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>{policy.date}</Text>
              <Ionicons name="arrow-forward" size={20} color="#2563eb" />
            </View>
          </TouchableOpacity>
        ))}
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
  filterButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  policyCard: {
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
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  policyDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});