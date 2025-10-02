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
import { useSound } from '../../hooks/useSound';

const { width, height } = Dimensions.get('window');

// Premium Button Component
interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  enableSound?: boolean;
  soundVolume?: number;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  enableSound = true,
  soundVolume,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const { playButtonPress, playButtonTap } = useSound({ enabled: enableSound, volume: soundVolume });

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
  };

  const handlePress = async () => {
    // Play appropriate sound based on button variant
    if (enableSound && !disabled && !loading) {
      if (variant === 'primary') {
        await playButtonPress(); // More substantial sound for primary actions
      } else {
        await playButtonTap(); // Lighter sound for secondary/ghost buttons
      }
    }
    
    // Call the original onPress handler
    onPress();
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.newPrimaryButton,
          isPressed && styles.newPrimaryButtonPressed,
          disabled && styles.newPrimaryButtonDisabled,
          style,
        ]}
      >
        <LinearGradient
          colors={disabled ? ['#E2E8F0', '#CBD5E0'] : ['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.newPrimaryButtonGradient,
            isPressed && styles.newPrimaryButtonGradientPressed,
          ]}
        >
          <Text
            style={[
              styles.newPrimaryButtonText,
              disabled && styles.newPrimaryButtonTextDisabled,
            ]}
          >
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.newSecondaryButton,
          isPressed && styles.newSecondaryButtonPressed,
          disabled && styles.newSecondaryButtonDisabled,
          style,
        ]}
      >
        <Text
          style={[
            styles.newSecondaryButtonText,
            disabled && styles.newSecondaryButtonTextDisabled,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  }

  // Ghost variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.newGhostButton,
        isPressed && styles.newGhostButtonPressed,
        disabled && styles.newGhostButtonDisabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.newGhostButtonText,
          disabled && styles.newGhostButtonTextDisabled,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
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
  // Button styles - original border radius with grey overlay fix
  newPrimaryButton: {
    borderRadius: 16,
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(102, 126, 234, 0.3)',
    overflow: 'hidden',
  },
  newPrimaryButtonPressed: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopColor: 'rgba(102, 126, 234, 0.2)',
    borderLeftColor: 'rgba(102, 126, 234, 0.2)',
    borderRightColor: 'rgba(102, 126, 234, 0.2)',
  },
  newPrimaryButtonDisabled: {
    borderBottomColor: '#E2E8F0',
  },
  newPrimaryButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  newPrimaryButtonGradientPressed: {
    // Gradient remains the same when pressed
  },
  newPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  newPrimaryButtonTextDisabled: {
    color: '#A0AEC0',
  },
  
  newSecondaryButton: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  newSecondaryButtonPressed: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopColor: 'rgba(102, 126, 234, 0.2)',
    borderLeftColor: 'rgba(102, 126, 234, 0.2)',
    borderRightColor: 'rgba(102, 126, 234, 0.2)',
  },
  newSecondaryButtonDisabled: {
    borderBottomColor: '#E2E8F0',
    borderColor: '#E2E8F0',
  },
  newSecondaryButtonText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  newSecondaryButtonTextDisabled: {
    color: '#A0AEC0',
  },
  
  newGhostButton: {
    borderRadius: 16,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  newGhostButtonPressed: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  newGhostButtonDisabled: {
    // No special disabled styling for ghost
  },
  newGhostButtonText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  newGhostButtonTextDisabled: {
    color: '#CBD5E0',
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
  
  // Card styles - fixed to prevent rectangular flash
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    // Removed overflow: 'hidden' to prevent flash
  },
  selectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#667EEA',
    borderWidth: 2,
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
});