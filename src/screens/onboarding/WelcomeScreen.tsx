import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const handleContinue = () => {
    navigation.navigate('Profession');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>CME Tracker</Text>
          <Text style={styles.subtitle}>
            Your secure, offline continuing education companion
          </Text>
        </View>

        {/* Key Features Section */}
        <Card style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>✨ Key Features</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Track Progress</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureText}>Smart Scanner</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🗂️</Text>
              <Text style={styles.featureText}>Digital Vault</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⏰</Text>
              <Text style={styles.featureText}>Smart Reminders</Text>
            </View>
          </View>
        </Card>

        {/* Privacy Section */}
        <Card style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.sectionTitle}>Your Privacy is Protected</Text>
          </View>
          <View style={styles.privacyGrid}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyFeatureIcon}>📱</Text>
              <Text style={styles.privacyText}>100% Offline - Data never leaves your device</Text>
            </View>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyFeatureIcon}>🔐</Text>
              <Text style={styles.privacyText}>Encrypted storage - Your data is secure</Text>
            </View>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🏥 Built specifically for healthcare professionals who value privacy
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="Let's Get Started"
          onPress={handleContinue}
          style={styles.primaryButton}
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
    padding: theme.spacing[3],
    paddingBottom: theme.spacing[1],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  appName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Features section
  featuresCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  featureIcon: {
    fontSize: 18,
    marginBottom: theme.spacing[1],
  },
  featureText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  
  // Privacy section
  privacyCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: theme.spacing[2],
  },
  privacyGrid: {
    gap: theme.spacing[2],
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyFeatureIcon: {
    fontSize: 14,
    marginRight: theme.spacing[2],
  },
  privacyText: {
    fontSize: 10,
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  footerText: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 12,
  },
  actions: {
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  primaryButton: {
    marginBottom: theme.spacing[1],
  },
});