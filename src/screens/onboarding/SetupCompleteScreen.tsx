import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingStackParamList } from '../../types/navigation';
import { useOnboardingContext } from '../../contexts/OnboardingContext';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from './OnboardingComponents';

type SetupCompleteScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'SetupComplete'>;

interface Props {
  navigation: SetupCompleteScreenNavigationProp;
}

const NEXT_STEPS = [
  {
    icon: '📝',
    title: 'Start tracking your activities',
    description: 'Log your CME sessions, conferences, and learning',
    colors: ['#667EEA', '#764BA2'],
  },
  {
    icon: '📸',
    title: 'Scan and store certificates',
    description: 'Upload completion certificates for secure storage',
    colors: ['#F093FB', '#F5576C'],
  },
  {
    icon: '📅',
    title: 'Set up license renewal reminders',
    description: 'Never miss important renewal deadlines',
    colors: ['#4FACFE', '#00F2FE'],
  },
  {
    icon: '📊',
    title: 'Monitor your progress',
    description: 'Track completion toward your annual goals',
    colors: ['#43E97B', '#38F9D7'],
  },
];

export const SetupCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const { completeOnboarding } = useOnboardingContext();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const stepCardsAnim = useRef(NEXT_STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entry animations
    Animated.sequence([
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
      ]),
      // Celebration animation
      Animated.spring(celebrationAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      // Staggered step cards
      Animated.stagger(120, 
        stepCardsAnim.map(anim => 
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

  const handleStartUsingApp = async () => {
    setIsLoading(true);
    
    try {
      const success = await completeOnboarding();

      if (success) {
        // Force a small delay to ensure state propagation
        setTimeout(() => {
          // This should trigger any listeners to recheck the state
        }, 200);
        // Navigation will automatically switch to main app due to the navigation logic
        // in AppNavigator based on onboarding status
      } else {
        __DEV__ && console.error('❌ Failed to complete onboarding');
      }
    } catch (error) {
      __DEV__ && console.error('💥 Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedGradientBackground />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.celebrationContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  {
                    scale: celebrationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FA709A', '#FEE140']}
                style={styles.celebrationIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.subtitle}>
              Your CPD & CME Tracker is now configured and ready to help you stay compliant with your continuing education requirements.
            </Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.nextStepsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.nextStepsTitle}>What's next?</Text>
            
            <View style={styles.stepsList}>
              {NEXT_STEPS.map((step, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.stepWrapper,
                    {
                      opacity: stepCardsAnim[index],
                      transform: [{
                        translateY: stepCardsAnim[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <PremiumCard style={styles.stepCard}>
                    <View style={styles.stepContent}>
                      <View style={styles.stepIconContainer}>
                        <LinearGradient
                          colors={step.colors}
                          style={styles.stepIcon}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.stepEmoji}>{step.icon}</Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.stepTextContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                      </View>
                    </View>
                  </PremiumCard>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
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
          title="Start Using CPD & CME Tracker"
          onPress={handleStartUsingApp}
          loading={isLoading}
          variant="primary"
          style={styles.primaryButton}
        />
        
        <PremiumButton
          title="Back"
          variant="ghost"
          onPress={() => navigation.goBack()}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FA709A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  nextStepsContainer: {
    alignItems: 'center',
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  stepsList: {
    width: '100%',
    gap: 12,
  },
  stepWrapper: {
    marginBottom: 4,
  },
  stepCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIconContainer: {
    marginRight: 16,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 20,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
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