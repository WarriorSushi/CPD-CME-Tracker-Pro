import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressIndicator } from '../../components';
import { OnboardingStackParamList } from '../../types';
import { userOperations } from '../../services/database';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from './OnboardingComponents';

type ProfessionScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Profession'>;

interface Props {
  navigation: ProfessionScreenNavigationProp;
}

export const ProfessionScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const inputScaleAnim = useRef(new Animated.Value(0.96)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputShadowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations with better timing
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
      Animated.spring(inputScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Add shadow after input appears
      Animated.timing(inputShadowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, []);

  const handleContinue = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    
    try {
      const result = await userOperations.updateUser({
        profileName: name.trim(),
      });

      if (result.success) {
        navigation.navigate('CreditSystem');
      } else {
        __DEV__ && console.error('Failed to save name:', result.error);
      }
    } catch (error) {
      __DEV__ && console.error('Error saving name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <AnimatedGradientBackground />

        {/* Fixed Progress Indicator - no animation to prevent moving */}
        <View style={styles.progressWrapper}>
          <ProgressIndicator currentStep={1} totalSteps={5} showTitle={false} />
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Fixed Header - no animation to prevent moving */}
              <View style={styles.header}>
                <View style={styles.emojiContainer}>
                  <LinearGradient
                    colors={['#667EEA', '#764BA2']}
                    style={styles.emojiGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.emoji}>👋</Text>
                  </LinearGradient>
                </View>
                <Text style={styles.title}>What should we call you?</Text>
                <Text style={styles.subtitle}>
                  Let's personalize your experience with a friendly touch
                </Text>
              </View>

              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { scale: inputScaleAnim },
                      { translateY: slideAnim },
                    ],
                  },
                ]}
              >
                <PremiumCard style={[
                  styles.inputCard,
                  styles.inputCardOverride,
                  {
                    elevation: inputShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                    shadowOpacity: inputShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
                  }
                ]}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your preferred name"
                      placeholderTextColor="#A0AEC0"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                      maxLength={50}
                      autoFocus={false}
                    />
                    {name.length > 0 && (
                      <Animated.View style={styles.inputIndicator}>
                        <LinearGradient
                          colors={['#48BB78', '#38A169']}
                          style={styles.checkmarkGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.checkmark}>✓</Text>
                        </LinearGradient>
                      </Animated.View>
                    )}
                  </View>
                </PremiumCard>
                <Text style={styles.inputHint}>
                  This is how we'll address you throughout the app
                </Text>
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
              title="Continue"
              onPress={handleContinue}
              disabled={!name.trim()}
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
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressWrapper: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emojiContainer: {
    marginBottom: 20,
  },
  emojiGradient: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
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
  inputContainer: {
    width: '100%',
    marginBottom: 40,
  },
  inputCard: {
    padding: 0,
    overflow: 'hidden',
  },
  inputCardOverride: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    padding: 20,
    fontSize: 18,
    color: '#1A202C',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  inputIndicator: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -16 }],
  },
  checkmarkGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
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