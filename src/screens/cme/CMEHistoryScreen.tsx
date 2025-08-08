import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Card, Button, Input, LoadingSpinner } from '../../components';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { CMEStackParamList } from '../../types/navigation';
import { CMEEntry } from '../../types';

type CMEHistoryScreenNavigationProp = StackNavigationProp<CMEStackParamList, 'CMEHistory'>;

interface Props {
  navigation: CMEHistoryScreenNavigationProp;
}

export const CMEHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { 
    cmeEntries, 
    isLoadingCME, 
    refreshCMEData,
    deleteCMEEntry,
    user 
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshCMEData();
    }, [refreshCMEData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCMEData();
    setRefreshing(false);
  }, [refreshCMEData]);

  // Filter entries based on search and year
  const filteredEntries = cmeEntries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const entryYear = new Date(entry.dateAttended).getFullYear();
    const matchesYear = entryYear === selectedYear;

    return matchesSearch && matchesYear;
  });

  // Calculate total credits for filtered entries
  const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.creditsEarned, 0);

  // Get available years
  const availableYears = [...new Set(cmeEntries.map(entry => 
    new Date(entry.dateAttended).getFullYear()
  ))].sort((a, b) => b - a);

  const handleEditEntry = (entry: CMEEntry) => {
    navigation.navigate('AddCME', { editEntry: entry });
  };

  const handleDeleteEntry = (entry: CMEEntry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCMEEntry(entry.id);
            if (!success) {
              Alert.alert('Error', 'Failed to delete entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No CME entries found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search criteria'
          : 'Start tracking your continuing education by adding your first entry'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Add First Entry"
          onPress={() => navigation.navigate('AddCME', {})}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  const renderEntry = ({ item }: { item: CMEEntry }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.entryProvider} numberOfLines={1}>
            {item.provider}
          </Text>
          <View style={styles.entryMeta}>
            <Text style={styles.entryDate}>
              {new Date(item.dateAttended).toLocaleDateString()}
            </Text>
            <Text style={styles.entryCategory}>• {item.category}</Text>
          </View>
        </View>
        
        <View style={styles.entryCredits}>
          <Text style={styles.creditsValue}>{item.creditsEarned}</Text>
          <Text style={styles.creditsLabel}>{user?.creditSystem || 'hrs'}</Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.entryNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      <View style={styles.entryActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditEntry(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteEntry(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderYearButton = (year: number) => (
    <TouchableOpacity
      key={year}
      style={[
        styles.yearButton,
        selectedYear === year && styles.yearButtonActive
      ]}
      onPress={() => setSelectedYear(year)}
    >
      <Text style={[
        styles.yearButtonText,
        selectedYear === year && styles.yearButtonTextActive
      ]}>
        {year}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CME History</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCME', {})}
        >
          <View style={styles.addButtonContent}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Entry</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search and Stats */}
      <View style={styles.controls}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search entries..."
          style={styles.searchInput}
        />
        
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredEntries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCredits.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Total {user?.creditSystem || 'Credits'}</Text>
            </View>
            {user?.annualRequirement && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {((totalCredits / user.annualRequirement) * 100).toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>of Annual Goal</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Year Filter */}
        {availableYears.length > 1 && (
          <View style={styles.yearFilter}>
            <Text style={styles.yearFilterLabel}>Year:</Text>
            <View style={styles.yearButtons}>
              {availableYears.map(renderYearButton)}
            </View>
          </View>
        )}
      </View>

      {/* Entries List */}
      {isLoadingCME ? (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} />
          <Text style={styles.loadingText}>Loading your entries...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: theme.spacing[6],
    borderBottomRightRadius: theme.spacing[6],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  addButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    shadowColor: theme.colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
    marginRight: theme.spacing[2],
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background,
  },

  // Controls
  controls: {
    padding: theme.spacing[5],
    gap: theme.spacing[4],
  },
  searchInput: {
    // Input styles applied by component
  },
  
  // Stats
  statsCard: {
    paddingVertical: theme.spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Year Filter
  yearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  yearFilterLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  yearButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  yearButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray.light,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  yearButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  yearButtonTextActive: {
    color: theme.colors.background,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[5],
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },

  // List
  listContent: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },

  // Entry Cards
  entryCard: {
    marginBottom: theme.spacing[4],
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  entryInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  entryProvider: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  entryCategory: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  entryCredits: {
    alignItems: 'center',
  },
  creditsValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  creditsLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  entryNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing[3],
  },

  // Actions
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing[3],
  },
  actionButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing[6],
  },
  emptyButton: {
    minWidth: 150,
  },
});