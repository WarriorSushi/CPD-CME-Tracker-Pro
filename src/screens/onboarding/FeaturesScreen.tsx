import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { SvgIcon } from '../../components/common/SvgIcon';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type FeaturesScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Features'>;

interface Props {
  navigation: FeaturesScreenNavigationProp;
}

export const FeaturesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleContinue = () => {
    navigation.navigate('Privacy');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Key Features</Text>
          <Text style={styles.subtitle}>Everything you need to stay compliant</Text>
        </View>

        <View style={styles.featuresGrid}>
          <Card style={styles.featureCard}>
            <SvgIcon name="chart" size={32} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Track Progress</Text>
            <Text style={styles.featureDescription}>Visual progress tracking</Text>
          </Card>

          <Card style={styles.featureCard}>
            <SvgIcon name="camera" size={32} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Smart Scanner</Text>
            <Text style={styles.featureDescription}>Auto-extract certificate data</Text>
          </Card>

          <Card style={styles.featureCard}>
            <SvgIcon name="vault" size={32} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Digital Vault</Text>
            <Text style={styles.featureDescription}>Store certificates securely</Text>
          </Card>

          <Card style={styles.featureCard}>
            <SvgIcon name="clock" size={32} color={theme.colors.primary} />
            <Text style={styles.featureTitle}>Smart Reminders</Text>
            <Text style={styles.featureDescription}>Never miss renewals</Text>
          </Card>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
        />
        
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
          style={styles.secondaryButton}
        />
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    marginBottom: theme.spacing[4],
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: theme.spacing[2],
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
  secondaryButton: {
    // Secondary button styles
  },
});