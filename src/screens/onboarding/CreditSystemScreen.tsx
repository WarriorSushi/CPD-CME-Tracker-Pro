import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { tokens } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types/navigation';
import { CreditSystem } from '../../types';
import { userOperations } from '../../services/database';
import { useAppContext } from '../../contexts/AppContext';

type CreditSystemScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CreditSystem'>;

interface Props {
  navigation: CreditSystemScreenNavigationProp;
}

const CREDIT_SYSTEMS: { value: CreditSystem; title: string; description: string }[] = [
  { value: 'CME', title: 'CME Credits', description: 'Continuing Medical Education credits' },
  { value: 'CPD', title: 'CPD Points', description: 'Continuing Professional Development points' },
  { value: 'CE', title: 'CE Units', description: 'Continuing Education units' },
  { value: 'Hours', title: 'Contact Hours', description: 'Direct contact or learning hours' },
  { value: 'Points', title: 'Credit Points', description: 'General professional credit points' },
];

export const CreditSystemScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refreshUserData } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState<CreditSystem | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (selectedSystem) {
      setIsLoading(true);
      try {

        // Save credit system to user data
        const result = await userOperations.updateUser({
          creditSystem: selectedSystem,
        });

        if (result.success) {

          // Refresh user data in context to pick up the new credit system
          await refreshUserData();

          navigation.navigate('AnnualTarget');
        } else {
      __DEV__ && console.error('❌ CreditSystemScreen: Failed to save credit system:', result.error);
        }
      } catch (error) {
      __DEV__ && console.error('💥 CreditSystemScreen: Error saving credit system:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <ProgressIndicator currentStep={2} totalSteps={5} />
        
        <View style={styles.header}>
          <Text style={styles.title}>Credit System</Text>
          <Text style={styles.subtitle}>Which credit system do you use?</Text>
        </View>

        <View style={styles.systemsContainer}>
          {CREDIT_SYSTEMS.map((system) => (
            <TouchableOpacity
              key={system.value}
              style={[
                styles.systemCard,
                selectedSystem === system.value && styles.selectedSystemCard,
              ]}
              onPress={() => setSelectedSystem(system.value)}
            >
              <View style={styles.systemContent}>
                <Text style={[
                  styles.systemTitle,
                  selectedSystem === system.value && styles.selectedSystemTitle,
                ]}>
                  {system.title}
                </Text>
                <Text style={styles.systemDescription}>
                  {system.description}
                </Text>
              </View>
              {selectedSystem === system.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
          disabled={!selectedSystem}
          loading={isLoading}
        />
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
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
    padding: theme.spacing[3],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  systemsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  systemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    marginBottom: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSystemCard: {
    borderColor: theme.colors.primary,
    backgroundColor: tokens.color.selectedBg,
  },
  systemContent: {
    flex: 1,
  },
  systemTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  selectedSystemTitle: {
    color: theme.colors.primary,
  },
  systemDescription: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    lineHeight: 12,
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
    marginLeft: theme.spacing[3],
  },
  actions: {
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  primaryButton: {
    marginBottom: theme.spacing[2],
  },
});