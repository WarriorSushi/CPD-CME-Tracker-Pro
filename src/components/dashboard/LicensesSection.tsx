import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { PremiumCard, PremiumButton } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';
import { getCreditUnit } from '../../utils/creditTerminology';

interface LicensesSectionProps {
  licenses: any[];
  user: any;
  licensesCardAnim: Animated.Value;
  licensesShadowAnim: Animated.Value;
  onAddLicense: () => void;
  onEditLicense: (license: any) => void;
  onSetReminders: (license: any) => void;
}

export const LicensesSection: React.FC<LicensesSectionProps> = ({
  licenses,
  user,
  licensesCardAnim,
  licensesShadowAnim,
  onAddLicense,
  onEditLicense,
  onSetReminders,
}) => {
  // Helper function to calculate days between dates
  const calculateDaysUntil = (expirationDateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDateString);
    if (isNaN(expDate.getTime())) {
      __DEV__ && console.error('[ERROR] Invalid date string:', expirationDateString);
      return 0;
    }
    expDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffMs = expDate.getTime() - today.getTime();
    return Math.ceil(diffMs / msPerDay);
  };

  const handleSetReminder = (license: any) => {
    Alert.alert(
      'Set Reminder',
      `Would you like to set renewal reminders for ${license.licenseType}?\n\nRecommended reminder schedule:\n• 90 days before\n• 60 days before\n• 30 days before\n• 14 days before\n• 7 days before\n• 1 day before`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Set Reminders',
          onPress: () => onSetReminders(license)
        }
      ]
    );
  };

  // Show ALL licenses, sorted by expiration date (most urgent first)
  const allLicenses = licenses
    .map(license => {
      const daysUntil = calculateDaysUntil(license.expirationDate);
      return { ...license, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        {
          opacity: licensesCardAnim,
          transform: [{
            translateY: licensesCardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <PremiumCard style={[
        styles.sectionCard,
        {
          elevation: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
          shadowOpacity: licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
        }
      ]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>Your Licenses</Text>
          <PremiumButton
            title="+ Add License"
            onPress={onAddLicense}
            variant="secondary"
            style={styles.headerButton}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.sectionSubtitle}>
            View and manage all your professional licenses here. Tap Edit to update expiration dates after renewal.
          </Text>

          {/* All License Cards - Show all licenses */}
          {allLicenses.map((license) => {
            const { daysUntil } = license;
            let statusColor = theme.colors.success;
            let statusText = 'Active';
            let statusIcon = <SvgIcon name="tickWithCircle" size={20} />;

            if (daysUntil < 0) {
              statusColor = theme.colors.error;
              statusText = 'Expired';
              statusIcon = <SvgIcon name="alert" size={20} color={theme.colors.error} />;
            } else if (daysUntil <= 30) {
              statusColor = theme.colors.error;
              statusText = `${daysUntil} days left`;
              statusIcon = <SvgIcon name="warning" size={20} color={theme.colors.error} />;
            } else if (daysUntil <= 90) {
              statusColor = theme.colors.warning;
              statusText = `${daysUntil} days left`;
              statusIcon = <SvgIcon name="clock" size={20} color={theme.colors.warning} />;
            } else {
              statusText = `${daysUntil} days left`;
            }

            return (
              <PremiumCard key={license.id} style={styles.licenseCard}>
                <View style={styles.licenseCardHeader}>
                  <View style={styles.licenseCardMain}>
                    {typeof statusIcon === 'string' ? (
                      <Text style={styles.licenseIconText}>{statusIcon}</Text>
                    ) : (
                      statusIcon
                    )}
                    <View style={styles.licenseInfo}>
                      <Text style={styles.licenseCardTitle} numberOfLines={1}>
                        {license.licenseType}
                      </Text>
                      <Text style={styles.licenseCardAuthority} numberOfLines={1}>
                        {license.issuingAuthority}
                      </Text>
                      <Text style={styles.licenseCardExpiry}>
                        Expires: {new Date(license.expirationDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.licenseStatusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.licenseStatusText}>{statusText}</Text>
                  </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.licenseCardActions}>
                  <TouchableOpacity
                    style={styles.licenseActionButton}
                    onPress={() => onEditLicense(license)}
                  >
                    <View style={styles.licenseActionContent}>
                      <SvgIcon name="edit" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.licenseActionText}>Edit</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.licenseActionButton}
                    onPress={() => handleSetReminder(license)}
                  >
                    <View style={styles.licenseActionContent}>
                      <SvgIcon name="reminder" size={14} color={theme.colors.text.primary} />
                      <Text style={styles.licenseActionText}>Remind</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Progress indicator if credits are tracked */}
                {license.requiredCredits > 0 && (
                  <View style={styles.licenseProgress}>
                    <Text style={styles.licenseProgressText}>
                      Credits: {license.completedCredits}/{license.requiredCredits} {user?.creditSystem ? getCreditUnit(user.creditSystem) : ''}
                    </Text>
                    <View style={styles.licenseProgressBar}>
                      <View
                        style={[
                          styles.licenseProgressFill,
                          {
                            width: `${Math.min((license.completedCredits / license.requiredCredits) * 100, 100)}%`,
                            backgroundColor: license.completedCredits >= license.requiredCredits ? theme.colors.success : theme.colors.primary
                          }
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Renewal Instructions */}
                <View style={styles.licenseRenewalInstructions}>
                  <SvgIcon name="info" size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.renewalInstructionsText}>
                    Already renewed? Tap "Edit" and update the expiration date.
                  </Text>
                </View>
              </PremiumCard>
            );
          })}
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardContent: {
    gap: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  licenseCard: {
    padding: 16,
    marginTop: 12,
    backgroundColor: '#FAFBFC',
  },
  licenseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  licenseCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  licenseIconText: {
    fontSize: 20,
  },
  licenseInfo: {
    flex: 1,
  },
  licenseCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  licenseCardAuthority: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  licenseCardExpiry: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  licenseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  licenseStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  licenseCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  licenseActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  licenseActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  licenseActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  licenseProgress: {
    marginBottom: 12,
  },
  licenseProgressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  licenseProgressBar: {
    height: 6,
    backgroundColor: theme.colors.gray.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  licenseProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  licenseRenewalInstructions: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  renewalInstructionsText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});
