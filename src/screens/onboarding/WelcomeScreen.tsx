import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from './OnboardingComponents';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const feature1Anim = useRef(new Animated.Value(0)).current;
  const feature2Anim = useRef(new Animated.Value(0)).current;
  const feature3Anim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations to add elevation after cards appear
  const shadow1Anim = useRef(new Animated.Value(0)).current;
  const shadow2Anim = useRef(new Animated.Value(0)).current;
  const shadow3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Staggered feature card animations
    Animated.sequence([
      Animated.delay(300),
      Animated.stagger(150, [
        Animated.spring(feature1Anim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature2Anim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature3Anim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Add shadows after cards finish animating (using setValue to avoid conflicts)
      setTimeout(() => {
        shadow1Anim.setValue(1);
        shadow2Anim.setValue(1);
        shadow3Anim.setValue(1);
      }, 100);
    });
  }, []);

  const handleContinue = () => {
    navigation.navigate('Profession');
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
            styles.header,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo-transparent.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Professional Tracker</Text>
          <Text style={styles.subtitle}>
            Your journey to excellence starts here
          </Text>
        </Animated.View>

        {/* Premium Feature Cards */}
        <View style={styles.featuresSection}>
          <Animated.View 
            style={[
              styles.featureWrapper,
              { 
                opacity: feature1Anim,
                transform: [{ 
                  translateY: feature1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }] 
              }
            ]}
          >
            <PremiumCard style={[
              styles.featureCard, 
              styles.featureCardOverride,
              {
                elevation: shadow1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: shadow1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.featureIcon}>📊</Text>
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureHeading}>Smart Tracking</Text>
                <Text style={styles.featureSubtext}>
                  Intelligent progress monitoring with beautiful visualizations
                </Text>
              </View>
            </PremiumCard>
          </Animated.View>

          <Animated.View 
            style={[
              styles.featureWrapper,
              { 
                opacity: feature2Anim,
                transform: [{ 
                  translateY: feature2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }] 
              }
            ]}
          >
            <PremiumCard style={[
              styles.featureCard, 
              styles.featureCardOverride,
              {
                elevation: shadow2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: shadow2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#F687B3', '#D53F8C']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.featureIcon}>🔐</Text>
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureHeading}>Complete Privacy</Text>
                <Text style={styles.featureSubtext}>
                  Your data never leaves your device, 100% secure
                </Text>
              </View>
            </PremiumCard>
          </Animated.View>

          <Animated.View 
            style={[
              styles.featureWrapper,
              { 
                opacity: feature3Anim,
                transform: [{ 
                  translateY: feature3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }] 
              }
            ]}
          >
            <PremiumCard style={[
              styles.featureCard, 
              styles.featureCardOverride,
              {
                elevation: shadow3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: shadow3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
              <View style={styles.featureIconContainer}>
                <LinearGradient
                  colors={['#48BB78', '#38A169']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.featureIcon}>✨</Text>
                </LinearGradient>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureHeading}>Effortless</Text>
                <Text style={styles.featureSubtext}>
                  Designed for busy professionals, quick and intuitive
                </Text>
              </View>
            </PremiumCard>
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
          title="Get Started"
          onPress={handleContinue}
          variant="primary"
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 26,
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
    fontWeight: '500',
  },
  
  // Features section
  featuresSection: {
    flex: 1,
  },
  featureWrapper: {
    marginBottom: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  featureCardOverride: {
    // Fix gray rectangle flash during animation
    elevation: 0, // Remove elevation that causes gray shadow during opacity animation
    shadowOpacity: 0, // Remove shadow that creates gray background
    borderWidth: 0,
  },
  featureIconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
  },
  featureContent: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 3,
  },
  featureSubtext: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
  },
  
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
  },
});