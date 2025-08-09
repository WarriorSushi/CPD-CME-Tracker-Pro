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
          <Text style={styles.appName}>CPD/CME Tracker</Text>
          <Text style={styles.subtitle}>
            Your secure, offline continuing education companion
          </Text>
        </View>

        {/* Key Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Key Features</Text>
          
          <View style={styles.featuresGrid}>
            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureHeading}>Track Your Progress</Text>
              <Text style={styles.featureSubtext}>Visual progress tracking with circular charts showing your completion percentage and time remaining</Text>
            </Card>

            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureHeading}>Smart Certificate Scanner</Text>
              <Text style={styles.featureSubtext}>Automatically extract CME data from certificates using advanced OCR technology</Text>
            </Card>

            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>🗂️</Text>
              <Text style={styles.featureHeading}>Secure Digital Vault</Text>
              <Text style={styles.featureSubtext}>Store and organize all your certificates with encrypted, searchable storage</Text>
            </Card>

            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>⏰</Text>
              <Text style={styles.featureHeading}>Smart Renewal Reminders</Text>
              <Text style={styles.featureSubtext}>Never miss license renewals with customizable notifications and deadline tracking</Text>
            </Card>

            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureHeading}>100% Private & Offline</Text>
              <Text style={styles.featureSubtext}>All your data stays on your device - no cloud storage, no data collection</Text>
            </Card>

            <Card style={styles.featureCard}>
              <Text style={styles.featureIcon}>📤</Text>
              <Text style={styles.featureHeading}>Export Your Data</Text>
              <Text style={styles.featureSubtext}>Generate professional reports and export to CSV for compliance audits</Text>
            </Card>
          </View>
        </View>

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
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  appName: {
    fontSize: theme.typography.fontSize.xxxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Features section
  featuresSection: {
    marginBottom: theme.spacing[2],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    marginBottom: theme.spacing[2],
    alignItems: 'center',
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: theme.spacing[1],
  },
  featureHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  featureSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 14,
    textAlign: 'center',
  },
  
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  actions: {
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  primaryButton: {
    marginBottom: theme.spacing[2],
  },
});