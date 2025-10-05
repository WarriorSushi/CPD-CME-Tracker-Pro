import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressIndicator } from '../../components';
import { SvgIcon, IconName } from '../../components/common/SvgIcon';
import { OnboardingStackParamList } from '../../types/navigation';
import { CreditSystem } from '../../types';
import { userOperations } from '../../services/database';
import { useAppContext } from '../../contexts/AppContext';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';

type CreditSystemScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'CreditSystem'>;

interface Props {
  navigation: CreditSystemScreenNavigationProp;
}

const CREDIT_SYSTEMS: { 
  value: CreditSystem; 
  title: string; 
  description: string;
  icon: IconName;
  colors: string[];
}[] = [
  { 
    value: 'CME', 
    title: 'CME Credits', 
    description: 'Continuing Medical Education for physicians and healthcare providers',
    icon: 'medical',
    colors: ['#667EEA', '#764BA2']
  },
  { 
    value: 'CPD', 
    title: 'CPD Points', 
    description: 'Continuing Professional Development for all healthcare professionals',
    icon: 'book',
    colors: ['#F093FB', '#F5576C']
  },
  { 
    value: 'CE', 
    title: 'CE Units', 
    description: 'Continuing Education units for various healthcare disciplines',
    icon: 'graduation',
    colors: ['#4FACFE', '#00F2FE']
  },
  { 
    value: 'Hours', 
    title: 'Contact Hours', 
    description: 'Direct contact or learning hours for skill development',
    icon: 'clock',
    colors: ['#43E97B', '#38F9D7']
  },
  { 
    value: 'Points', 
    title: 'Credit Points', 
    description: 'General professional credit points for career advancement',
    icon: 'target',
    colors: ['#FA709A', '#FEE140']
  },
];

export const CreditSystemScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { refreshUserData } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState<CreditSystem | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(CREDIT_SYSTEMS.map(() => new Animated.Value(0))).current;
  const shadowAnims = useRef(CREDIT_SYSTEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
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
      Animated.stagger(100, 
        cardAnims.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ),
    ]).start(() => {
      // Add shadows after cards finish animating (using setValue to avoid conflicts)
      setTimeout(() => {
        shadowAnims.forEach(anim => anim.setValue(1));
      }, 100);
    });
  }, []);

  const handleContinue = async () => {
    if (selectedSystem) {
      setIsLoading(true);
      try {
        const result = await userOperations.updateUser({
          creditSystem: selectedSystem,
        });

        if (result.success) {
          await refreshUserData();
          navigation.navigate('AnnualTarget');
        } else {
          __DEV__ && console.error('[ERROR] CreditSystemScreen: Failed to save credit system:', result.error);
        }
      } catch (error) {
        __DEV__ && console.error('[ERROR] CreditSystemScreen: Error saving credit system:', error);
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
        <ProgressIndicator currentStep={2} totalSteps={5} />
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
                <SvgIcon name="chart" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Choose Your Credit System</Text>
            <Text style={styles.subtitle}>
              Select the type of continuing education credits you track
            </Text>
          </Animated.View>

          <View style={styles.optionsList}>
            {CREDIT_SYSTEMS.map((system, index) => (
              <Animated.View 
                key={system.value}
                style={[
                  styles.optionWrapper,
                  {
                    opacity: cardAnims[index],
                    transform: [{
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <PremiumCard
                  selected={selectedSystem === system.value}
                  onPress={() => setSelectedSystem(system.value)}
                  style={[
                    styles.optionCard,
                    styles.optionCardOverride,
                    {
                      elevation: shadowAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                      shadowOpacity: shadowAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
                    }
                  ]}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <LinearGradient
                        colors={system.colors}
                        style={styles.optionIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <SvgIcon
                          name={system.icon}
                          size={32}
                          color={theme.colors.white}
                        />
                      </LinearGradient>
                    </View>
                    <View style={styles.optionTextContent}>
                      <Text style={[
                        styles.optionTitle,
                        selectedSystem === system.value && styles.selectedOptionTitle,
                      ]}>
                        {system.title}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        selectedSystem === system.value && styles.selectedOptionDescription,
                      ]}>
                        {system.description}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioButton,
                      selectedSystem === system.value && styles.selectedRadioButton,
                    ]}>
                      {selectedSystem === system.value && (
                        <LinearGradient
                          colors={['#667EEA', '#764BA2']}
                          style={styles.radioButtonInner}
                        />
                      )}
                    </View>
                  </View>
                </PremiumCard>
              </Animated.View>
            ))}
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
          disabled={!selectedSystem}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  headerEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  optionsList: {
    gap: 8,
    marginBottom: 20,
  },
  optionWrapper: {
    marginBottom: 2,
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionCardOverride: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    marginRight: 16,
  },
  optionIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContent: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  selectedOptionTitle: {
    color: '#667EEA',
  },
  optionDescription: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
  },
  selectedOptionDescription: {
    color: '#4A5568',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#667EEA',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.base,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    // Ghost button styles handled by component
  },
});
