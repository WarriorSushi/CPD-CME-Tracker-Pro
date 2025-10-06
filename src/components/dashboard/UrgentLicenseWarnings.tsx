import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PremiumCard } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';

interface UrgentLicenseWarningsProps {
  urgentRenewals: any[];
  remindersCardAnim: Animated.Value;
  remindersShadowAnim: Animated.Value;
  onRenewLicense: (license: any) => void;
  onViewAll: () => void;
}

export const UrgentLicenseWarnings: React.FC<UrgentLicenseWarningsProps> = ({
  urgentRenewals,
  remindersCardAnim,
  remindersShadowAnim,
  onRenewLicense,
  onViewAll,
}) => {
  if (urgentRenewals.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: remindersCardAnim,
          transform: [{
            translateY: remindersCardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <PremiumCard style={[
        styles.urgentWarningCard,
        {
                    shadowOpacity: Number(remindersShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] })),
        }
      ]}>
        <View style={styles.urgentWarningHeader}>
          <View style={styles.urgentWarningIcon}>
            <SvgIcon name="warning" size={24} color="#FFF" />
          </View>
          <View style={styles.urgentWarningTitleContainer}>
            <Text style={styles.urgentWarningTitle}>License Renewal Required</Text>
            <Text style={styles.urgentWarningSubtitle}>
              {urgentRenewals.length} license{urgentRenewals.length > 1 ? 's' : ''} expiring soon
            </Text>
          </View>
        </View>

        {urgentRenewals.slice(0, 2).map((license) => {
          const daysUntil = Math.ceil((new Date(license.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          let urgencyColor = theme.colors.error;
          let urgencyText = 'Overdue';

          if (daysUntil < 0) {
            urgencyColor = theme.colors.error;
            urgencyText = 'Expired';
          } else if (daysUntil <= 7) {
            urgencyColor = theme.colors.error;
            urgencyText = `${daysUntil} days left`;
          } else if (daysUntil <= 30) {
            urgencyColor = theme.colors.warning;
            urgencyText = `${daysUntil} days left`;
          } else {
            urgencyColor = theme.colors.primary;
            urgencyText = `${daysUntil} days left`;
          }

          return (
            <View key={license.id} style={styles.urgentLicenseItem}>
              <View style={styles.urgentLicenseInfo}>
                <Text style={styles.urgentLicenseType} numberOfLines={1}>
                  {license.licenseType}
                </Text>
                <Text style={styles.urgentLicenseAuthority} numberOfLines={1}>
                  {license.issuingAuthority}
                </Text>
                <Text style={styles.urgentLicenseExpiry}>
                  Expires: {new Date(license.expirationDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.urgentLicenseActions}>
                <View style={[styles.urgentLicenseStatus, { backgroundColor: urgencyColor }]}>
                  <Text style={styles.urgentLicenseStatusText}>{urgencyText}</Text>
                </View>
                <TouchableOpacity
                  style={styles.urgentLicenseButton}
                  onPress={() => onRenewLicense(license)}
                >
                  <Text style={styles.urgentLicenseButtonText}>Renew</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {urgentRenewals.length > 2 && (
          <TouchableOpacity
            style={styles.viewAllUrgentButton}
            onPress={onViewAll}
          >
            <Text style={styles.viewAllUrgentText}>
              View all {urgentRenewals.length} expiring licenses
            </Text>
          </TouchableOpacity>
        )}
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  urgentWarningCard: {
    padding: theme.spacing[5], // Primary card padding
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: theme.colors.error + '40',
  },
  urgentWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  urgentWarningIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full, // Circular icon
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentWarningTitleContainer: {
    flex: 1,
  },
  urgentWarningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.error,
    marginBottom: 4,
  },
  urgentWarningSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  urgentLicenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  urgentLicenseInfo: {
    flex: 1,
    marginRight: 12,
  },
  urgentLicenseType: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  urgentLicenseAuthority: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  urgentLicenseExpiry: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  urgentLicenseActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  urgentLicenseStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xl,
  },
  urgentLicenseStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  urgentLicenseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  urgentLicenseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAllUrgentButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginTop: 4,
  },
  viewAllUrgentText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
