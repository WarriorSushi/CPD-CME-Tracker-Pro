import React from 'react';
import { View, Text, StyleSheet, Animated, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumCard, PremiumButton } from '../common/OnboardingComponents';
import { SimpleProgressRing } from '../charts/SimpleProgressRing';
import { ProgressAnimatedBackground } from './ProgressAnimatedBackground';
import { theme } from '../../constants/theme';
import { getCreditUnit } from '../../utils/creditTerminology';
import { getProgressColor } from '../../utils/dashboardHelpers';

interface ProgressCardProps {
  currentYearProgress: any;
  user: any;
  progressGradient1: Animated.Value;
  progressGradient2: Animated.Value;
  progressGradient3: Animated.Value;
  progressShadowAnim: Animated.Value;
  onAddEntry: () => void;
}

// Premium stat capsule component
interface StatCapsuleProps {
  value: string | number;
  label: string;
  accentColor?: string;
  gradientColors?: readonly [ColorValue, ColorValue];
}

const StatCapsule: React.FC<StatCapsuleProps> = ({
  value,
  label,
  accentColor = theme.colors.primary,
  gradientColors = ['#F8F9FA', '#FFFFFF'] as const
}) => {
  return (
    <View style={styles.capsuleWrapper}>
      <LinearGradient
        colors={gradientColors}
        style={styles.capsule}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.capsuleAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.capsuleValue}>{value}</Text>
        <Text style={styles.capsuleLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );
};

export const ProgressCard: React.FC<ProgressCardProps> = ({
  currentYearProgress,
  user,
  progressGradient1,
  progressGradient2,
  progressGradient3,
  progressShadowAnim,
  onAddEntry,
}) => {
  const earnedCredits = currentYearProgress?.totalCompleted?.toFixed(1) || '0';
  const goalCredits = currentYearProgress?.totalRequired || user?.annualRequirement || 0;
  const remainingCredits = Math.max(
    (currentYearProgress?.totalRequired || 0) - (currentYearProgress?.totalCompleted || 0),
    0
  ).toFixed(1);
  const daysRemaining = currentYearProgress?.remainingDays || 0;
  const creditUnit = user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits';

  return (
    <View style={styles.container}>
      <ProgressAnimatedBackground
        progressGradient1={progressGradient1}
        progressGradient2={progressGradient2}
        progressGradient3={progressGradient3}
      />
      <PremiumCard style={[
        styles.progressCard,
        {
          elevation: Number(progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] })),
          shadowOpacity: Number(progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] })),
        }
      ]}>
        {/* Header */}
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleContainer}>
            <Text style={styles.progressMainTitle}>Your Progress</Text>
            <Text style={styles.progressSubtitle}>
              {user?.requirementPeriod && user.requirementPeriod > 1
                ? `${user.requirementPeriod}-Year Cycle`
                : 'Annual Goal'
              }
            </Text>
          </View>
        </View>

        {/* Progress Ring - Centered and Prominent */}
        <View style={styles.progressRingSection}>
          <SimpleProgressRing
            progress={currentYearProgress ? currentYearProgress.percentage / 100 : 0}
            size={160}
            color={currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium}
            backgroundColor={theme.colors.gray.light + '40'}
            strokeWidth={12}
            duration={2000}
          />
        </View>

        {/* Premium Stats Grid - 2x2 Capsules */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCapsule
              value={earnedCredits}
              label={`${creditUnit} Earned`}
              accentColor="#10B981"
              gradientColors={['#ECFDF5', '#FFFFFF'] as const}
            />
            <StatCapsule
              value={goalCredits}
              label="Annual Goal"
              accentColor="#3B82F6"
              gradientColors={['#EFF6FF', '#FFFFFF'] as const}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCapsule
              value={remainingCredits}
              label="Remaining"
              accentColor="#F59E0B"
              gradientColors={['#FFFBEB', '#FFFFFF'] as const}
            />
            <StatCapsule
              value={daysRemaining}
              label="Days Left"
              accentColor="#8B5CF6"
              gradientColors={['#F5F3FF', '#FFFFFF'] as const}
            />
          </View>
        </View>

        {/* Premium Add Entry Button */}
        <View style={styles.addEntryInUpperSection}>
          <PremiumButton
            title="+ Add New Entry"
            onPress={onAddEntry}
            variant="primary"
            style={styles.addEntryButton}
          />
        </View>
      </PremiumCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 8,
  },
  progressCard: {
    padding: theme.spacing[5],
    backgroundColor: '#FFFFFF',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitleContainer: {
    flex: 1,
  },
  progressMainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  // Progress Ring Section
  progressRingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  // Premium Stats Grid
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Capsule Styles
  capsuleWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  capsule: {
    borderRadius: 12,
    padding: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 64,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  capsuleAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  capsuleValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  capsuleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Add Entry Button
  addEntryInUpperSection: {
    marginTop: 8,
  },
  addEntryButton: {
    width: '100%',
  },
});


