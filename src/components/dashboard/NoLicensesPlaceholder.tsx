import React from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { PremiumCard, PremiumButton } from '../common/OnboardingComponents';
import { SvgIcon } from '../common/SvgIcon';
import { theme } from '../../constants/theme';

interface NoLicensesPlaceholderProps {
  licensesCardAnim: Animated.Value;
  licensesShadowAnim: Animated.Value;
  onAddLicense: () => void;
}

export const NoLicensesPlaceholder: React.FC<NoLicensesPlaceholderProps> = ({
  licensesCardAnim,
  licensesShadowAnim,
  onAddLicense,
}) => {
  return (
    <Animated.View
      style={[
        styles.noLicensesSection,
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
        styles.noLicensesCard,
        {
                    shadowOpacity: Number(licensesShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
        }
      ]}>
        <View style={styles.noLicensesContent}>
          <SvgIcon
            name="profile"
            size={48}
            color={theme.colors.text.secondary}
            accessibilityLabel="No licenses"
          />
          <Text style={styles.noLicensesTitle}>Track Your Licenses</Text>
          <Text style={styles.noLicensesSubtitle}>
            Add your professional licenses to track renewal deadlines and never miss a renewal date.
          </Text>
          <PremiumButton
            title="Add Your First License"
            onPress={onAddLicense}
            variant="primary"
            style={styles.addEntryButton}
          />
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  noLicensesSection: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  noLicensesCard: {
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  noLicensesContent: {
    alignItems: 'center',
    gap: 16,
  },
  noLicensesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  noLicensesSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  addEntryButton: {
    width: '100%',
  },
});




