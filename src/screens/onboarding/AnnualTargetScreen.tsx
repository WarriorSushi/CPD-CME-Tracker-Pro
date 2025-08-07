import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { DEFAULT_CREDIT_REQUIREMENTS, Profession } from '../../constants';

type AnnualTargetScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'AnnualTarget'>;

interface Props {
  navigation: AnnualTargetScreenNavigationProp;
}

const COMMON_REQUIREMENTS = [20, 25, 30, 40, 50, 75];
const TIME_PERIODS = [1, 2, 3, 5];

// Some common defaults to show as small hints
const COMMON_EXAMPLES = [
  { credits: 50, period: 1, example: 'US Physicians' },
  { credits: 40, period: 2, example: 'UK Doctors' },
  { credits: 150, period: 5, example: 'Australian Allied Health' },
];

export const AnnualTargetScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [customTarget, setCustomTarget] = useState('');
  const [customPeriod, setCustomPeriod] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);

  const handleContinue = () => {
    const target = useCustomTarget ? parseInt(customTarget) : selectedTarget;
    const period = useCustomPeriod ? parseInt(customPeriod) : selectedPeriod;
    if (target && target > 0 && period && period > 0) {
      // TODO: Save target and period to onboarding data
      navigation.navigate('LicenseSetup');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleQuickSelectTarget = (target: number) => {
    setSelectedTarget(target);
    setUseCustomTarget(false);
    setCustomTarget('');
  };

  const handleQuickSelectPeriod = (period: number) => {
    setSelectedPeriod(period);
    setUseCustomPeriod(false);
    setCustomPeriod('');
  };

  const handleCustomTargetInput = (value: string) => {
    setCustomTarget(value);
    setSelectedTarget(null);
    setUseCustomTarget(true);
  };

  const handleCustomPeriodInput = (value: string) => {
    setCustomPeriod(value);
    setSelectedPeriod(null);
    setUseCustomPeriod(true);
  };

  const targetValue = useCustomTarget ? parseInt(customTarget) : selectedTarget;
  const periodValue = useCustomPeriod ? parseInt(customPeriod) : selectedPeriod;
  const isValid = targetValue && targetValue > 0 && periodValue && periodValue > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Credit Requirements</Text>
          <Text style={styles.subtitle}>How many credits do you need and over what period?</Text>
        </View>

        <View style={styles.targetContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Credits</Text>
            <View style={styles.optionsGrid}>
              {COMMON_REQUIREMENTS.map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.optionCard,
                    selectedTarget === target && styles.selectedCard,
                  ]}
                  onPress={() => handleQuickSelectTarget(target)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedTarget === target && styles.selectedText,
                  ]}>
                    {target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              placeholder="Enter custom amount"
              value={customTarget}
              onChangeText={handleCustomTargetInput}
              keyboardType="numeric"
              style={styles.customInputBox}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Period (Years)</Text>
            <View style={styles.optionsGrid}>
              {TIME_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.optionCard,
                    selectedPeriod === period && styles.selectedCard,
                  ]}
                  onPress={() => handleQuickSelectPeriod(period)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedPeriod === period && styles.selectedText,
                  ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              placeholder="Enter custom amount"
              value={customPeriod}
              onChangeText={handleCustomPeriodInput}
              keyboardType="numeric"
              style={styles.customInputBox}
            />
          </View>

          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>Examples:</Text>
            {COMMON_EXAMPLES.map((example, index) => (
              <Text key={index} style={styles.exampleText}>
                {example.credits} credits / {example.period} year{example.period > 1 ? 's' : ''} ({example.example})
              </Text>
            ))}
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
          disabled={!isValid}
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
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  targetContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    marginBottom: theme.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    width: '22%',
    minHeight: 50,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  selectedText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  customInputBox: {
    width: '100%',
    textAlign: 'center',
  },
  examplesSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.small,
    padding: theme.spacing[2],
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
    marginTop: theme.spacing[2],
  },
  examplesTitle: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  exampleText: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
    lineHeight: 11,
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: theme.spacing[3],
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
});