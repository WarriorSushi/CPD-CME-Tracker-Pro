import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, Image } from 'react-native';
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
  const feature1Anim = useRef(new Animated.Value(width * 0.5)).current;
  const feature2Anim = useRef(new Animated.Value(width * 0.5)).current;
  const feature3Anim = useRef(new Animated.Value(width * 0.5)).current;

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
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature2Anim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature3Anim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate('Profession');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <AnimatedGradientBackground />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                opacity: fadeAnim,
                transform: [{ translateX: feature1Anim }] 
              }
            ]}
          >
            <PremiumCard style={styles.featureCard}>
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
                opacity: fadeAnim,
                transform: [{ translateX: feature2Anim }] 
              }
            ]}
          >
            <PremiumCard style={styles.featureCard}>
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
                opacity: fadeAnim,
                transform: [{ translateX: feature3Anim }] 
              }
            ]}
          >
            <PremiumCard style={styles.featureCard}>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 32,
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
    fontWeight: '500',
  },
  
  // Features section
  featuresSection: {
    marginBottom: 32,
  },
  featureWrapper: {
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  featureIconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureContent: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  featureSubtext: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  
  actions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
});