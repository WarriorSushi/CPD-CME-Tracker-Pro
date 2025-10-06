import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Animated, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressIndicator } from '../../components';
import { SvgIcon } from '../../components/common/SvgIcon';
import { OnboardingStackParamList } from '../../types/navigation';
import { CreditSystem } from '../../types';
import { getCreditTerminology } from '../../utils/creditTerminology';
import { userOperations } from '../../services/database';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';

type AnnualTargetScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'AnnualTarget'>;

interface Props {
  navigation: AnnualTargetScreenNavigationProp;
}

const COMMON_REQUIREMENTS = [20, 25, 30, 40, 50];
const TIME_PERIODS = [1, 2, 3, 5];

export const AnnualTargetScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [customTarget, setCustomTarget] = useState('');
  const [customPeriod, setCustomPeriod] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<number | 'custom' | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'custom' | null>(null);
  const [creditSystem, setCreditSystem] = useState<CreditSystem>('CME');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const targetCardsAnim = useRef(COMMON_REQUIREMENTS.map(() => new Animated.Value(0))).current;
  const periodCardsAnim = useRef(TIME_PERIODS.map(() => new Animated.Value(0))).current;
  const targetShadowAnims = useRef(COMMON_REQUIREMENTS.map(() => new Animated.Value(0))).current;
  const periodShadowAnims = useRef(TIME_PERIODS.map(() => new Animated.Value(0))).current;
  const customTargetShadowAnim = useRef(new Animated.Value(0)).current;
  const customPeriodShadowAnim = useRef(new Animated.Value(0)).current;

  const terminology = getCreditTerminology(creditSystem);

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
      Animated.stagger(60, [
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
    ]).start(() => {
      // Add shadow animations after cards finish appearing (using setValue to avoid conflicts)
      setTimeout(() => {
        targetShadowAnims.forEach(anim => anim.setValue(1));
        periodShadowAnims.forEach(anim => anim.setValue(1));
        customTargetShadowAnim.setValue(1);
        customPeriodShadowAnim.setValue(1);
      }, 100);
    });
  }, []);

  const handleQuickSelectTarget = (target: number) => {
    if (selectedTarget === target) {
      // Re-clicking same tile unselects it
      setSelectedTarget(null);
    } else {
      setSelectedTarget(target);
      setCustomTarget(''); // Clear custom input when selecting preset
    }
  };

  const handleQuickSelectPeriod = (period: number) => {
    if (selectedPeriod === period) {
      // Re-clicking same tile unselects it
      setSelectedPeriod(null);
    } else {
      setSelectedPeriod(period);
      setCustomPeriod(''); // Clear custom input when selecting preset
    }
  };

  const handleCustomTargetSelect = () => {
    setSelectedTarget('custom');
    setCustomTarget('');
  };

  const handleCustomPeriodSelect = () => {
    setSelectedPeriod('custom');
    setCustomPeriod('');
  };

  const handleCustomTargetInput = (value: string) => {
    setCustomTarget(value);
  };

  const handleCustomPeriodInput = (value: string) => {
    setCustomPeriod(value);
  };

  const handleContinue = async () => {
      const targetValue = selectedTarget === 'custom' ? parseInt(customTarget) : (typeof selectedTarget === 'number' ? selectedTarget : null);
    const periodValue = selectedPeriod === 'custom' ? parseInt(customPeriod) : (typeof selectedPeriod === 'number' ? selectedPeriod : null);
    
    if (!targetValue || !periodValue || targetValue <= 0 || periodValue <= 0) return;

    setIsLoading(true);
    try {
      const result = await userOperations.updateUser({
        annualRequirement: targetValue,
        requirementPeriod: periodValue,
      });

      if (result.success) {
        navigation.navigate('CycleStartDate');
      } else {
        __DEV__ && console.error('[ERROR] AnnualTargetScreen: Failed to save annual target');
      }
    } catch (error) {
      __DEV__ && console.error('[ERROR] AnnualTargetScreen: Error saving annual target:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const targetValue = selectedTarget === 'custom' ? parseInt(customTarget) : selectedTarget;
  const periodValue = selectedPeriod === 'custom' ? parseInt(customPeriod) : selectedPeriod;
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
        <ProgressIndicator currentStep={3} totalSteps={5} showTitle={false} />
      </Animated.View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <SvgIcon name="target" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Set Your Target</Text>
          <Text style={styles.subtitle}>
            How many {terminology.plural.toLowerCase()} do you need over what period?
          </Text>
        </Animated.View>

        {/* Target Credits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{terminology.label} Required</Text>
          <View style={styles.optionsRow}>
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
                  style={[
                    styles.optionCard,
                    {
                      elevation: targetShadowAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 4],
                      }),
                      shadowOpacity: targetShadowAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.15],
                      }),
                    } as any
                  ]}
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
            
            {/* Custom input as inline tile */}
            <Animated.View
              style={[
                styles.optionWrapper,
                {
                  opacity: targetCardsAnim[0], // Use first animation for consistency
                  transform: [{
                    translateY: targetCardsAnim[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  }],
                },
              ]}
            >
              <PremiumCard
                selected={selectedTarget === 'custom'}
                onPress={handleCustomTargetSelect}
                style={[
                  styles.optionCard,
                  styles.customTileCard,
                  {
                    elevation: customTargetShadowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4],
                    }),
                    shadowOpacity: customTargetShadowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.15],
                    }),
                  } as any
                ]}
              >
                {selectedTarget === 'custom' ? (
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                    value={customTarget || ''}
                    onChangeText={handleCustomTargetInput}
                    keyboardType="numeric"
                    style={styles.customTileInput}
                    maxLength={4}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <Text style={[
                    styles.optionText,
                    selectedTarget === 'custom' && styles.selectedText,
                  ]}>
                    Custom
                  </Text>
                )}
              </PremiumCard>
            </Animated.View>
          </View>
        </View>

        {/* Time Period Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period (Years)</Text>
          <View style={styles.optionsRow}>
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
                  style={[
                    styles.optionCard,
                    {
                      elevation: periodShadowAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 4],
                      }),
                      shadowOpacity: periodShadowAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.15],
                      }),
                    } as any
                  ]}
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
            
            {/* Custom input as inline tile */}
            <Animated.View
              style={[
                styles.optionWrapper,
                {
                  opacity: periodCardsAnim[0], // Use first animation for consistency
                  transform: [{
                    translateY: periodCardsAnim[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  }],
                },
              ]}
            >
              <PremiumCard
                selected={selectedPeriod === 'custom'}
                onPress={handleCustomPeriodSelect}
                style={[
                  styles.optionCard,
                  styles.customTileCard,
                  {
                    elevation: customPeriodShadowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4],
                    }),
                    shadowOpacity: customPeriodShadowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.15],
                    }),
                  } as any
                ]}
              >
                {selectedPeriod === 'custom' ? (
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                    value={customPeriod || ''}
                    onChangeText={handleCustomPeriodInput}
                    keyboardType="numeric"
                    style={styles.customTileInput}
                    maxLength={2}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <Text style={[
                    styles.optionText,
                    selectedPeriod === 'custom' && styles.selectedText,
                  ]}>
                    Custom
                  </Text>
                )}
              </PremiumCard>
            </Animated.View>
          </View>
        </View>

        {/* Summary */}
        {isValid && (
          <Animated.View 
            style={[
              styles.summaryContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <PremiumCard style={styles.summaryCard}>
              <LinearGradient
                colors={['#48BB78', '#38A169']}
                style={styles.summaryIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <SvgIcon name="checkmark" size={24} color={theme.colors.success} />
              </LinearGradient>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>{String(targetValue || '')} {terminology.plural.toLowerCase()}</Text>
                <Text> over </Text>
                <Text style={styles.summaryBold}>{String(periodValue || '')} year{(periodValue && periodValue > 1) ? 's' : ''}</Text>
              </Text>
            </PremiumCard>
          </Animated.View>
        )}
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
    paddingTop: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  optionWrapper: {
    flex: 1,
    minWidth: 65,
    maxWidth: 80,
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  selectedText: {
    color: '#667EEA',
  },
  customTileCard: {
    // Additional styles for custom tile if needed
  },
  customTileInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667EEA',
    textAlign: 'center',
    minWidth: 30,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    outlineWidth: 0,
  },
  summaryContainer: {
    marginTop: -4,
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  summaryBold: {
    fontWeight: '600',
    color: '#1A202C',
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
});
