import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';

export default function TrackProgressScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');

  const progressItems = [
    {
      id: 1,
      title: 'Road Repair Request - MG Road',
      type: 'Infrastructure',
      progress: 75,
      status: 'In Progress',
      submittedDate: '15 Jan 2024',
      expectedCompletion: '30 Jan 2024',
      department: 'Public Works Department',
      updates: [
        { date: '20 Jan', message: 'Materials ordered and site inspection completed' },
        { date: '18 Jan', message: 'Work order approved by PWD' },
        { date: '15 Jan', message: 'Request submitted and acknowledged' },
      ],
    },
    {
      id: 2,
      title: 'Scholarship Application Status',
      type: 'Education',
      progress: 50,
      status: 'Under Review',
      submittedDate: '10 Jan 2024',
      expectedCompletion: '25 Jan 2024',
      department: 'Department of Education',
      updates: [
        { date: '18 Jan', message: 'Documents verification in progress' },
        { date: '12 Jan', message: 'Application received and assigned reviewer' },
        { date: '10 Jan', message: 'Application submitted successfully' },
      ],
    },
    {
      id: 3,
      title: 'Water Supply Complaint',
      type: 'Utilities',
      progress: 100,
      status: 'Resolved',
      submittedDate: '05 Jan 2024',
      expectedCompletion: '12 Jan 2024',
      department: 'Water Works Department',
      updates: [
        { date: '12 Jan', message: 'Issue resolved - Water supply restored' },
        { date: '08 Jan', message: 'Maintenance team dispatched to location' },
        { date: '05 Jan', message: 'Complaint registered' },
      ],
    },
  ];

  const filters = [
    { key: 'all', label: 'All', count: 12 },
    { key: 'pending', label: 'Pending', count: 5 },
    { key: 'progress', label: 'In Progress', count: 4 },
    { key: 'resolved', label: 'Resolved', count: 3 },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved': return '#10b981';
      case 'in progress': return '#3b82f6';
      case 'under review': return '#f59e0b';
      default: return '#6b7280';
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
        <Text style={styles.title}>Track Progress</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter.key && styles.activeFilterText
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="sync" size={24} color="#3b82f6" />
            </View>
            <View>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Progress Items */}
        {progressItems.map((item) => (
          <View key={item.id} style={styles.progressCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDepartment}>{item.department}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) }
                ]}>
                  {item.status}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercent}>{item.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { 
                    width: `${item.progress}%`,
                    backgroundColor: getStatusColor(item.status)
                  }
                ]} />
              </View>
            </View>

            {/* Dates */}
            <View style={styles.datesSection}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Submitted</Text>
                <Text style={styles.dateValue}>{item.submittedDate}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Expected</Text>
                <Text style={styles.dateValue}>{item.expectedCompletion}</Text>
              </View>
            </View>

            {/* Latest Update */}
            <View style={styles.updateSection}>
              <Text style={styles.updateTitle}>Latest Update</Text>
              <Text style={styles.updateText}>{item.updates[0].message}</Text>
              <Text style={styles.updateDate}>{item.updates[0].date}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="eye" size={16} color="#2563eb" />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble" size={16} color="#2563eb" />
                <Text style={styles.actionButtonText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Empty State for filtered results */}
        {activeFilter !== 'all' && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyDescription}>
              No items match the selected filter. Try selecting a different category.
            </Text>
          </View>
        )}
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
  filterButton: {
    padding: 8,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeFilterTab: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  statIcon: {
    marginRight: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressCard: {
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
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDepartment: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  datesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  updateSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  updateTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  updateText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  updateDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
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
  },
});