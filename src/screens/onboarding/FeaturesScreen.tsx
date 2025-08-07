import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressCircle } from '../../components';
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Everything you need to</Text>
            <Text style={styles.subtitle}>stay compliant</Text>
          </View>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Track Your Progress</Text>
            </View>
            <Text style={styles.featureDescription}>
              Visual progress tracking with circular indicators. See exactly how close you are to meeting your annual requirements.
            </Text>
            <View style={styles.demoContainer}>
              <ProgressCircle progress={0.65} size={80}>
                <View style={styles.progressContent}>
                  <Text style={styles.progressPercentage}>65%</Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                </View>
              </ProgressCircle>
            </View>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureTitle}>Smart Certificate Scanner</Text>
            </View>
            <Text style={styles.featureDescription}>
              Simply take a photo of your certificate and let our smart scanner extract all the important information automatically.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>🗂️</Text>
              <Text style={styles.featureTitle}>Digital Certificate Vault</Text>
            </View>
            <Text style={styles.featureDescription}>
              Store all your certificates securely in one place. Search, organize, and access them instantly whenever needed.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>⏰</Text>
              <Text style={styles.featureTitle}>License Renewal Reminders</Text>
            </View>
            <Text style={styles.featureDescription}>
              Never let a license expire again. Get customizable reminders at 90, 60, 30, and 7 days before expiration.
            </Text>
          </Card>

          <Card style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📈</Text>
              <Text style={styles.featureTitle}>Professional Reports</Text>
            </View>
            <Text style={styles.featureDescription}>
              Generate professional compliance reports for license renewals, job applications, or credentialing committees.
            </Text>
          </Card>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[5],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    marginTop: theme.spacing[5],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  featureCard: {
    marginBottom: theme.spacing[4],
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  featureIcon: {
    fontSize: 28,
    marginRight: theme.spacing[3],
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  demoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  progressContent: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
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