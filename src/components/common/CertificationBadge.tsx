import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

export interface BadgeLevel {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: [string, string];
  requirement: number;
  type: 'credits' | 'streak' | 'milestone' | 'special';
}

export interface CertificationBadgeProps {
  badge: BadgeLevel;
  earned: boolean;
  progress?: number; // 0-1 for progress towards earning
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

// Professional badge definitions for medical professionals
export const CERTIFICATION_BADGES: BadgeLevel[] = [
  // Credit-based badges
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first CME activity',
    icon: '🎯',
    colors: ['#4F46E5', '#7C3AED'],
    requirement: 1,
    type: 'credits'
  },
  {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Earn 25 CME credits',
    icon: '📚',
    colors: ['#059669', '#10B981'],
    requirement: 25,
    type: 'credits'
  },
  {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Earn 50 CME credits',
    icon: '🔍',
    colors: ['#DC2626', '#EF4444'],
    requirement: 50,
    type: 'credits'
  },
  {
    id: 'expert_practitioner',
    name: 'Expert Practitioner',
    description: 'Earn 100 CME credits',
    icon: '⭐',
    colors: ['#D97706', '#F59E0B'],
    requirement: 100,
    type: 'credits'
  },
  {
    id: 'master_educator',
    name: 'Master Educator',
    description: 'Earn 200 CME credits',
    icon: '👑',
    colors: ['#7C2D12', '#EA580C'],
    requirement: 200,
    type: 'credits'
  },
  
  // Milestone badges
  {
    id: 'annual_achiever',
    name: 'Annual Achiever',
    description: 'Complete your annual requirement',
    icon: '🏆',
    colors: ['#1E40AF', '#3B82F6'],
    requirement: 1,
    type: 'milestone'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete requirement 6 months early',
    icon: '🐦',
    colors: ['#0D9488', '#14B8A6'],
    requirement: 1,
    type: 'milestone'
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    description: 'Complete 150% of requirement',
    icon: '🚀',
    colors: ['#BE185D', '#EC4899'],
    requirement: 1.5,
    type: 'milestone'
  },

  // Streak badges
  {
    id: 'consistent_learner',
    name: 'Consistent Learner',
    description: '7-day learning streak',
    icon: '🔥',
    colors: ['#DC2626', '#F87171'],
    requirement: 7,
    type: 'streak'
  },
  {
    id: 'learning_machine',
    name: 'Learning Machine',
    description: '30-day learning streak',
    icon: '⚡',
    colors: ['#7C2D12', '#F97316'],
    requirement: 30,
    type: 'streak'
  },

  // Special badges
  {
    id: 'category_explorer',
    name: 'Category Explorer',
    description: 'Complete activities in 5 different categories',
    icon: '🧭',
    colors: ['#581C87', '#8B5CF6'],
    requirement: 5,
    type: 'special'
  },
  {
    id: 'certificate_collector',
    name: 'Certificate Collector',
    description: 'Upload 10 certificates',
    icon: '📋',
    colors: ['#166534', '#22C55E'],
    requirement: 10,
    type: 'special'
  }
];

export const CertificationBadge: React.FC<CertificationBadgeProps> = ({
  badge,
  earned,
  progress = 0,
  size = 'medium',
  showProgress = false
}) => {
  const sizeStyles = getSizeStyles(size);
  const progressPercentage = Math.min(progress * 100, 100);

  return (
    <View style={[styles.container, sizeStyles.container]}>
      {/* Badge Circle */}
      <View style={[styles.badgeContainer, sizeStyles.badge]}>
        <LinearGradient
          colors={earned ? badge.colors : ['#E5E7EB', '#9CA3AF']}
          style={[styles.badgeGradient, sizeStyles.badge]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Progress Ring */}
          {showProgress && !earned && progress > 0 && (
            <View style={[styles.progressRing, sizeStyles.progressRing]}>
              <View 
                style={[
                  styles.progressFill,
                  sizeStyles.progressFill,
                  { 
                    transform: [{ 
                      rotate: `${(progressPercentage / 100) * 360}deg` 
                    }] 
                  }
                ]}
              />
            </View>
          )}
          
          {/* Badge Icon */}
          <Text style={[styles.badgeIcon, sizeStyles.icon]}>
            {earned ? badge.icon : '🔒'}
          </Text>
        </LinearGradient>
      </View>

      {/* Badge Info */}
      <View style={styles.badgeInfo}>
        <Text 
          style={[
            styles.badgeName, 
            sizeStyles.name,
            !earned && styles.badgeNameDisabled
          ]}
          numberOfLines={1}
        >
          {badge.name}
        </Text>
        
        {size !== 'small' && (
          <Text 
            style={[
              styles.badgeDescription, 
              sizeStyles.description,
              !earned && styles.badgeDescriptionDisabled
            ]}
            numberOfLines={2}
          >
            {badge.description}
          </Text>
        )}

        {/* Progress Indicator */}
        {showProgress && !earned && size !== 'small' && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, sizeStyles.progressBar]}>
              <View 
                style={[
                  styles.progressBarFill,
                  sizeStyles.progressBarFill,
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        container: { maxWidth: 80 },
        badge: { width: 40, height: 40 },
        icon: { fontSize: 16 },
        name: { fontSize: 10 },
        description: { fontSize: 8 },
        progressRing: { width: 44, height: 44 },
        progressFill: { width: 22, height: 44 },
        progressBar: { height: 3 },
        progressBarFill: { height: 3 }
      };
    case 'large':
      return {
        container: { maxWidth: 160 },
        badge: { width: 80, height: 80 },
        icon: { fontSize: 32 },
        name: { fontSize: 16 },
        description: { fontSize: 12 },
        progressRing: { width: 84, height: 84 },
        progressFill: { width: 42, height: 84 },
        progressBar: { height: 6 },
        progressBarFill: { height: 6 }
      };
    default: // medium
      return {
        container: { maxWidth: 120 },
        badge: { width: 60, height: 60 },
        icon: { fontSize: 24 },
        name: { fontSize: 13 },
        description: { fontSize: 10 },
        progressRing: { width: 64, height: 64 },
        progressFill: { width: 32, height: 64 },
        progressBar: { height: 4 },
        progressBarFill: { height: 4 }
      };
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    margin: theme.spacing[2],
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: theme.spacing[2],
  },
  badgeGradient: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  progressRing: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transformOrigin: '0 50%',
  },
  badgeIcon: {
    textAlign: 'center',
  },
  badgeInfo: {
    alignItems: 'center',
  },
  badgeName: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameDisabled: {
    color: theme.colors.textSecondary,
  },
  badgeDescription: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeDescriptionDisabled: {
    color: theme.colors.textTertiary,
  },
  progressContainer: {
    width: '100%',
    marginTop: theme.spacing[1],
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    backgroundColor: theme.colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});