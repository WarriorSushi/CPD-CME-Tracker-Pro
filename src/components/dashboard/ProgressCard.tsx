import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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

export const ProgressCard: React.FC<ProgressCardProps> = ({
  currentYearProgress,
  user,
  progressGradient1,
  progressGradient2,
  progressGradient3,
  progressShadowAnim,
  onAddEntry,
}) => {
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
          elevation: progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
          shadowOpacity: progressShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] }),
        }
      ]}>
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

        <View style={styles.progressMainContent}>
          {/* Days remaining moved to left of circle */}
          <View style={styles.progressTimeInfoLeft}>
            <Text style={styles.progressTimeValue}>
              {currentYearProgress?.remainingDays || 0}
            </Text>
            <Text style={styles.progressTimeLabel}>
              days remaining in cycle
            </Text>
          </View>

          <View style={styles.progressCircleContainer}>
            <SimpleProgressRing
              progress={currentYearProgress ? currentYearProgress.percentage / 100 : 0}
              size={140}
              color={currentYearProgress ? getProgressColor(currentYearProgress.status) : theme.colors.gray.medium}
              backgroundColor={theme.colors.gray.light + '60'}
              strokeWidth={10}
              duration={2000}
            />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>
                {currentYearProgress?.totalCompleted?.toFixed(1) || '0'}
              </Text>
              <Text style={styles.progressStatLabel}>{user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'} Earned</Text>
            </View>

            <View style={styles.progressStatDivider} />

            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>
                {currentYearProgress?.totalRequired || user?.annualRequirement || 0}
              </Text>
              <Text style={styles.progressStatLabel}>Goal
              </Text>
            </View>

            <View style={styles.progressStatDivider} />

            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>
                {Math.max(
                  (currentYearProgress?.totalRequired || 0) - (currentYearProgress?.totalCompleted || 0),
                  0
                ).toFixed(1)}
              </Text>
              <Text style={styles.progressStatLabel}>Remaining</Text>
            </View>
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
  upperSection: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  progressCard: {
    padding: theme.spacing[5], // Primary card padding
    backgroundColor: '#FFFFFF',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  progressMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressTimeInfoLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  progressTimeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  progressTimeLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'left',
    maxWidth: 80,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStats: {
    flex: 1,
    alignItems: 'flex-end',
  },
  progressStatItem: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  progressStatLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  progressStatDivider: {
    height: 1,
    width: 40,
    backgroundColor: theme.colors.border.medium,
    marginVertical: 8,
  },
  addEntryInUpperSection: {
    marginTop: 8,
  },
  addEntryButton: {
    width: '100%',
  },
});
