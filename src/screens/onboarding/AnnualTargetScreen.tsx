import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, ProgressIndicator } from '../../components';
import { OnboardingStackParamList } from '../../types/navigation';
import { Profession, CreditSystem } from '../../types';
import { getCreditTerminology } from '../../utils/creditTerminology';
import { userOperations } from '../../services/database';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from './OnboardingComponents';

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
  const [creditSystem, setCreditSystem] = useState<CreditSystem>('CME');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const targetCardsAnim = useRef(COMMON_REQUIREMENTS.map(() => new Animated.Value(0))).current;
  const periodCardsAnim = useRef(TIME_PERIODS.map(() => new Animated.Value(0))).current;

  // Load user's selected credit system and setup animations
  useEffect(() => {
    const loadCreditSystem = async () => {
      try {
        const result = await userOperations.getCurrentUser();
        if (result.success && result.data?.creditSystem) {
          setCreditSystem(result.data.creditSystem);
        }
      } catch (error) {
        __DEV__ && console.error('Error loading credit system:', error);
      }
    };

    loadCreditSystem();

    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    Animated.sequence([
      Animated.delay(300),
      Animated.stagger(80, [
        ...targetCardsAnim.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        ),
        ...periodCardsAnim.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  // Get dynamic terminology based on selected credit system
  const terminology = getCreditTerminology(creditSystem);

  const handleContinue = async () => {
    const target = useCustomTarget ? parseInt(customTarget) : selectedTarget;
    const period = useCustomPeriod ? parseInt(customPeriod) : selectedPeriod;
    if (target && target > 0 && period && period > 0) {
      setIsLoading(true);
      try {
        // Save both annual requirement and requirement period
        const result = await userOperations.updateUser({
          annualRequirement: target,
          requirementPeriod: period
        });

        if (result.success) {
          navigation.navigate('CycleStartDate');
        } else {
          __DEV__ && console.error('❌ AnnualTargetScreen: Failed to save target and period');
        }
      } catch (error) {
        __DEV__ && console.error('💥 AnnualTargetScreen: Error saving:', error);
      } finally {
        setIsLoading(false);
      }
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
      <AnimatedGradientBackground />

      <Animated.View 
        style={[
          styles.progressWrapper,
          {
            opacity: progressAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ProgressIndicator currentStep={3} totalSteps={5} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.headerIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.headerEmoji}>🎯</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>{terminology.title}</Text>
            <Text style={styles.subtitle}>
              How many {terminology.plural} do you need and over what period?
            </Text>
          </Animated.View>

          <View style={styles.sectionsContainer}>
            {/* Target Credits Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{terminology.label}</Text>
              <View style={styles.optionsGrid}>
                {COMMON_REQUIREMENTS.map((target, index) => (
                  <Animated.View
                    key={target}
                    style={[
                      styles.optionWrapper,
                      {
                        opacity: targetCardsAnim[index],
                        transform: [{
                          translateY: targetCardsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [15, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    <PremiumCard
                      selected={selectedTarget === target}
                      onPress={() => handleQuickSelectTarget(target)}
                      style={styles.optionCard}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedTarget === target && styles.selectedText,
                      ]}>
                        {target}
                      </Text>
                    </PremiumCard>
                  </Animated.View>
                ))}
              </View>
              <View style={styles.customInputContainer}>
                <Input
                  placeholder="Enter custom amount"
                  value={customTarget}
                  onChangeText={handleCustomTargetInput}
                  keyboardType="numeric"
                  style={styles.customInputBox}
                />
              </View>
            </View>

            {/* Time Period Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Period (Years)</Text>
              <View style={styles.optionsGrid}>
                {TIME_PERIODS.map((period, index) => (
                  <Animated.View
                    key={period}
                    style={[
                      styles.optionWrapper,
                      {
                        opacity: periodCardsAnim[index],
                        transform: [{
                          translateY: periodCardsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [15, 0],
                          }),
                        }],
                      },
                    ]}
                  >
                    <PremiumCard
                      selected={selectedPeriod === period}
                      onPress={() => handleQuickSelectPeriod(period)}
                      style={styles.optionCard}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedPeriod === period && styles.selectedText,
                      ]}>
                        {period}
                      </Text>
                    </PremiumCard>
                  </Animated.View>
                ))}
              </View>
              <View style={styles.customInputContainer}>
                <Input
                  placeholder="Enter custom years"
                  value={customPeriod}
                  onChangeText={handleCustomPeriodInput}
                  keyboardType="numeric"
                  style={styles.customInputBox}
                />
              </View>
            </View>

            {/* Examples Section */}
            <PremiumCard style={styles.examplesSection}>
              <View style={styles.examplesHeader}>
                <LinearGradient
                  colors={['#43E97B', '#38F9D7']}
                  style={styles.examplesIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.examplesEmoji}>💡</Text>
                </LinearGradient>
                <Text style={styles.examplesTitle}>Common Examples</Text>
              </View>
              {COMMON_EXAMPLES.map((example, index) => (
                <Text key={index} style={styles.exampleText}>
                  • {example.credits} {terminology.plural} / {example.period} year{example.period > 1 ? 's' : ''} ({example.example})
                </Text>
              ))}
            </PremiumCard>
          </View>
        </View>
      </ScrollView>
      
      <Animated.View 
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <PremiumButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid}
          loading={isLoading}
          variant="primary"
          style={styles.primaryButton}
        />
        
        <PremiumButton
          title="Back"
          variant="ghost"
          onPress={handleBack}
          style={styles.secondaryButton}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrapper: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  optionWrapper: {
    width: '22%',
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
  },
  selectedText: {
    color: '#667EEA',
  },
  customInputContainer: {
    marginTop: 8,
  },
  customInputBox: {
    textAlign: 'center',
    fontSize: 16,
  },
  examplesSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  examplesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  examplesIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examplesEmoji: {
    fontSize: 16,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  exampleText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    // Ghost button styles handled by component
  },
});