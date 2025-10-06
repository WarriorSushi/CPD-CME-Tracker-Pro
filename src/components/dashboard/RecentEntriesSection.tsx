import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, ViewStyle } from 'react-native';
import { PremiumCard } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';
import { getCreditUnit } from '../../utils/creditTerminology';

interface RecentEntriesSectionProps {
  recentEntries: any[];
  user: any;
  recentCardAnim: Animated.Value;
  recentShadowAnim: Animated.Value;
  onViewAll: () => void;
  onViewCertificate: (certificatePath: string) => void;
}

export const RecentEntriesSection: React.FC<RecentEntriesSectionProps> = ({
  recentEntries,
  user,
  recentCardAnim,
  recentShadowAnim,
  onViewAll,
  onViewCertificate,
}) => {
  const cardShadowStyle: ViewStyle = {
    elevation: Number(recentShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] })),
    shadowOpacity: Number(recentShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })),
  };

  if (recentEntries.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.recentSection,
        {
          opacity: recentCardAnim,
          transform: [{
            translateY: recentCardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentEntries.map((entry) => (
        <PremiumCard
          key={entry.id}
          style={[
            styles.activityItem,
            cardShadowStyle
          ]}
        >
          <View style={styles.activityContent}>
            <TouchableOpacity
              style={styles.activityIconWrapper}
              onPress={() => {
                if (entry.certificatePath) {
                  onViewCertificate(entry.certificatePath);
                }
              }}
              disabled={!entry.certificatePath}
            >
              {entry.certificatePath ? (
                <Image
                  source={{ uri: entry.certificatePath }}
                  style={styles.certificateThumbnailDashboard}
                  resizeMode="cover"
                />
              ) : (
                <SvgIcon name="book" size={24} color={theme.colors.primary} style={styles.activityIcon} />
              )}
            </TouchableOpacity>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.activityProvider} numberOfLines={1}>
                {entry.provider}
              </Text>
              <Text style={styles.activityDate}>
                {new Date(entry.dateAttended).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.activityCredits}>
              <Text style={styles.creditsValue}>{entry.creditsEarned}</Text>
              <Text style={styles.creditsUnit}>{user?.creditSystem ? getCreditUnit(user.creditSystem) : 'Credits'}</Text>
            </View>
          </View>
        </PremiumCard>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  recentSection: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  activityItem: {
    padding: theme.spacing[4], // List item card padding
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  certificateThumbnailDashboard: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  activityIcon: {
    marginRight: theme.spacing[3],
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  activityProvider: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  activityCredits: {
    alignItems: 'flex-end',
  },
  creditsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  creditsUnit: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
});



