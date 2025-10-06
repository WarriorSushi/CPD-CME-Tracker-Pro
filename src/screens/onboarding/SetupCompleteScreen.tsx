import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgIcon } from '../../components/common/SvgIcon';
import { OnboardingStackParamList } from '../../types/navigation';
import { useOnboardingContext } from '../../contexts/OnboardingContext';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';

type SetupCompleteScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'SetupComplete'>;

interface Props {
  navigation: SetupCompleteScreenNavigationProp;
}

const NEXT_STEPS = [
  {
    icon: 'pencil' as const,
    title: 'Start tracking your activities',
    description: 'Log your CME sessions, conferences, and learning',
    colors: ['#667EEA', '#764BA2'],
  },
  {
    icon: 'camera' as const,
    title: 'Scan and store certificates',
    description: 'Upload completion certificates for secure storage',
    colors: ['#F093FB', '#F5576C'],
  },
  {
    icon: 'calendar' as const,
    title: 'Set up license renewal reminders',
    description: 'Never miss important renewal deadlines',
    colors: ['#4FACFE', '#00F2FE'],
  },
  {
    icon: 'chart' as const,
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
  const stepShadowAnims = useRef(NEXT_STEPS.map(() => new Animated.Value(0))).current;

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
    ]).start(() => {
      // Add shadow animations after cards finish appearing (using setValue to avoid conflicts)
      setTimeout(() => {
        stepShadowAnims.forEach(anim => anim.setValue(1));
      }, 100);
    });
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
        __DEV__ && console.error('[ERROR] Failed to complete onboarding');

        // Show retry option if onboarding completion fails
        Alert.alert(
          'Setup Error',
          'Unable to complete setup. Would you like to try again?',
          [
            {
              text: 'Go Back',
              style: 'cancel',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Retry',
              onPress: () => handleStartUsingApp(),
            },
          ]
        );
      }
    } catch (error) {
      __DEV__ && console.error('[ERROR] Error completing onboarding:', error);

      // Show retry option on error
      Alert.alert(
        'Setup Error',
        'An error occurred during setup. Would you like to try again?',
        [
          {
            text: 'Go Back',
            style: 'cancel',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Retry',
            onPress: () => handleStartUsingApp(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedGradientBackground />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <SvgIcon name="celebration" size={48} color="#FFFFFF" />
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
                  <PremiumCard
                    style={[
                      styles.stepCard,
                      {
                        elevation: stepShadowAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 4],
                        }),
                        shadowOpacity: stepShadowAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.15],
                        }),
                      } as any
                    ]}
                  >
                    <View style={styles.stepContent}>
                      <View style={styles.stepIconContainer}>
                        <LinearGradient
                          colors={step.colors}
                          style={styles.stepIcon}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <SvgIcon name={step.icon} size={32} color="#FFFFFF" />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  celebrationIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FA709A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationEmoji: {
    fontSize: 28,
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
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  nextStepsContainer: {
    alignItems: 'center',
    flex: 1,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsList: {
    width: '100%',
    flex: 1,
    gap: 8,
  },
  stepWrapper: {
    marginBottom: 2,
  },
  stepCard: {
    paddingVertical: 12,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 16,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
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
