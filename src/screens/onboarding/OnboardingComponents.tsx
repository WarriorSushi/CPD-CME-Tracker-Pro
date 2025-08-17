import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Premium Button Component
interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (variant === 'primary') {
    return (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : opacityAnim,
          },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={disabled ? ['#CBD5E0', '#A0AEC0'] : ['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{title}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'secondary') {
    return (
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }],
            opacity: disabled ? 0.5 : opacityAnim,
          },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
          style={styles.secondaryButton}
        >
          <View style={styles.secondaryButtonInner}>
            <Text style={styles.secondaryButtonText}>{title}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Ghost variant
  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={styles.ghostButton}
      >
        <Text style={styles.ghostButtonText}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Gradient Background Component
export const AnimatedGradientBackground: React.FC = () => {
  const animation1 = useRef(new Animated.Value(0)).current;
  const animation2 = useRef(new Animated.Value(0)).current;
  const animation3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create floating bubble animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(animation1, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(animation1, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(animation2, {
            toValue: 1,
            duration: 10000,
            delay: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation2, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(animation3, {
            toValue: 1,
            duration: 12000,
            delay: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animation3, {
            toValue: 0,
            duration: 12000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base gradient - very subtle */}
      <LinearGradient
        colors={['#FAFBFD', '#F7F9FC', '#F3F4F6']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Animated gradient orbs for mesh effect */}
      <Animated.View
        style={[
          styles.gradientOrb,
          {
            transform: [
              {
                translateX: animation1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 100],
                }),
              },
              {
                translateY: animation1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 50],
                }),
              },
              {
                scale: animation1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 1],
                }),
              },
            ],
            opacity: 0.4,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.05)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.gradientOrb2,
          {
            transform: [
              {
                translateX: animation2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -100],
                }),
              },
              {
                translateY: animation2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, -100],
                }),
              },
              {
                scale: animation2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1],
                }),
              },
            ],
            opacity: 0.3,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.08)', 'rgba(236, 72, 153, 0.04)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.gradientOrb3,
          {
            transform: [
              {
                translateX: animation3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 150],
                }),
              },
              {
                translateY: animation3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -50],
                }),
              },
              {
                scale: animation3.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              },
            ],
            opacity: 0.3,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.06)', 'rgba(147, 51, 234, 0.03)']}
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

// Premium Card Component
interface PremiumCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  selected = false,
  onPress,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const CardContent = (
    <Animated.View
      style={[
        styles.card,
        selected && styles.selectedCard,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {selected && (
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.08)', 'rgba(118, 75, 162, 0.04)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  // Button styles
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  secondaryButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  secondaryButtonText: {
    color: '#4C51BF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ghostButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Gradient background styles
  gradientOrb: {
    position: 'absolute',
    top: '10%',
    left: '10%',
  },
  gradientOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
  },
  gradientOrb3: {
    position: 'absolute',
    top: '50%',
    right: '30%',
  },
  orb: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  
  // Card styles
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderWidth: 2,
  },
});