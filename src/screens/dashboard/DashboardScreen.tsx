import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressCircle, Card } from '../../components';
import { theme } from '../../constants/theme';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome to CME Tracker</Text>
        </View>

        <Card style={styles.progressCard}>
          <Text style={styles.cardTitle}>Annual Progress</Text>
          <View style={styles.progressContainer}>
            <ProgressCircle progress={0.0} size={120}>
              <View style={styles.progressContent}>
                <Text style={styles.progressValue}>0</Text>
                <Text style={styles.progressUnit}>of 50</Text>
                <Text style={styles.progressLabel}>hours</Text>
              </View>
            </ProgressCircle>
          </View>
          <Text style={styles.progressText}>
            You're just getting started! Add your first CME entry to begin tracking.
          </Text>
        </Card>

        <Card style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <Text style={styles.placeholderText}>
            • Add CME Entry{'\n'}
            • Scan Certificate{'\n'}
            • View History{'\n'}
            • Manage Licenses
          </Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing[5],
  },
  header: {
    marginBottom: theme.spacing[6],
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  progressCard: {
    marginBottom: theme.spacing[4],
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  progressContainer: {
    marginBottom: theme.spacing[4],
  },
  progressContent: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressUnit: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  quickActionsCard: {
    // Quick actions card styles
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});