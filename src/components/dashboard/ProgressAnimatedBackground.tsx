import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface ProgressAnimatedBackgroundProps {
  progressGradient1: Animated.Value;
  progressGradient2: Animated.Value;
  progressGradient3: Animated.Value;
}

export const ProgressAnimatedBackground: React.FC<ProgressAnimatedBackgroundProps> = ({
  progressGradient1,
  progressGradient2,
  progressGradient3,
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Base gradient - modern neutral theme for progress */}
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface, theme.colors.accent]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated gradient orbs */}
      <Animated.View
        style={[
          styles.progressGradientOrb1,
          {
            transform: [
              {
                translateX: progressGradient1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-80, 120],
                }),
              },
              {
                translateY: progressGradient1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 40],
                }),
              },
              {
                scale: progressGradient1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1],
                }),
              },
            ],
            opacity: 0.6,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.purple + '20', theme.colors.blue + '10']}
          style={styles.progressOrb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.progressGradientOrb2,
          {
            transform: [
              {
                translateX: progressGradient2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, -80],
                }),
              },
              {
                translateY: progressGradient2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, -60],
                }),
              },
              {
                scale: progressGradient2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 1],
                }),
              },
            ],
            opacity: 0.5,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.blue + '18', theme.colors.purple + '08']}
          style={styles.progressOrb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.progressGradientOrb3,
          {
            transform: [
              {
                translateX: progressGradient3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-60, 100],
                }),
              },
              {
                translateY: progressGradient3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, -40],
                }),
              },
              {
                scale: progressGradient3.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.15, 1],
                }),
              },
            ],
            opacity: 0.4,
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.purple + '15', theme.colors.emerald + '08']}
          style={styles.progressOrb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressGradientOrb1: {
    position: 'absolute',
    top: '5%',
    left: '5%',
  },
  progressGradientOrb2: {
    position: 'absolute',
    bottom: '15%',
    right: '5%',
  },
  progressGradientOrb3: {
    position: 'absolute',
    top: '40%',
    right: '25%',
  },
  progressOrb: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
  },
});
