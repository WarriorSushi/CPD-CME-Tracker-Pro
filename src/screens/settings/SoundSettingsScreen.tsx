import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import { StandardHeader, SvgIcon } from '../../components';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../../components/common/OnboardingComponents';
import { theme } from '../../constants/theme';
import { soundManager } from '../../services/sound/SoundManager';
import { useSound } from '../../hooks/useSound';

interface Props {
  navigation: any;
}

export const SoundSettingsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isEnabled, setIsEnabled] = useState(true);
  const [globalVolume, setGlobalVolume] = useState(0.3);
  const [isLoading, setIsLoading] = useState(false);
  
  const { playButtonTap, playSuccess, playError, playEntryAdd, playFormSubmit } = useSound();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const settingsCardAnim = useRef(new Animated.Value(0)).current;
  const testCardAnim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations
  const settingsShadowAnim = useRef(new Animated.Value(0)).current;
  const testShadowAnim = useRef(new Animated.Value(0)).current;

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  // Premium entrance animations
  useFocusEffect(
    React.useCallback(() => {
      // Premium entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered content animations
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(settingsCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(testCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Add shadows after animations finish
        setTimeout(() => {
          settingsShadowAnim.setValue(1);
          testShadowAnim.setValue(1);
        }, 100);
      });
    }, [])
  );

  const loadSettings = async () => {
    try {
      setIsEnabled(soundManager.isAudioEnabled());
      setGlobalVolume(soundManager.getGlobalVolume());
    } catch (error) {
      __DEV__ && console.error('Error loading sound settings:', error);
    }
  };

  const handleToggleSound = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await soundManager.setEnabled(enabled);
      setIsEnabled(enabled);
      
      // Play feedback sound if enabling
      if (enabled) {
        setTimeout(() => playSuccess(), 100);
      }
    } catch (error) {
      __DEV__ && console.error('Error toggling sound:', error);
      Alert.alert('Error', 'Failed to update sound settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolumeChange = async (volume: number) => {
    setGlobalVolume(volume);
    try {
      await soundManager.setGlobalVolume(volume);
    } catch (error) {
      __DEV__ && console.error('Error updating volume:', error);
    }
  };

  const handleVolumeChangeComplete = async () => {
    // Play test sound at new volume
    if (isEnabled) {
      await playButtonTap();
    }
  };

  const testSounds = [
    { name: 'Button Press', action: playButtonTap, description: 'All button interactions (65% volume)' },
    { name: 'Navigation', action: () => soundManager.play('navigationSwipe'), description: 'Screen transitions (35% volume)' },
    { name: 'Error', action: playError, description: 'Validation errors & failures (70% volume)' },
    { name: 'Notification', action: () => soundManager.play('notification'), description: 'Alerts & notifications (100% volume)' },
  ];

  const handleTestSound = async (action: () => Promise<void>, name: string) => {
    if (!isEnabled) {
      Alert.alert('Sounds Disabled', 'Enable sounds to test audio feedback.');
      return;
    }

    try {
      await action();
    } catch (error) {
      __DEV__ && console.error(`Error testing ${name} sound:`, error);
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset Sound Settings',
      'Reset all sound settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await soundManager.setEnabled(true);
              await soundManager.setGlobalVolume(0.3);
              setIsEnabled(true);
              setGlobalVolume(0.3);
              await playSuccess();
            } catch (error) {
              __DEV__ && console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset sound settings.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      
      <StandardHeader
        title="Sound Settings"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sound Settings Card */}
          <Animated.View 
            style={[
              {
                opacity: settingsCardAnim,
                transform: [{
                  translateY: settingsCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.settingsCard,
              {
                elevation: Number(settingsShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] })),
                shadowOpacity: Number(settingsShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] })),
              }
            ]}>
              <Text style={styles.cardTitle}>Audio Feedback</Text>
              <Text style={styles.cardSubtitle}>
                Control sound effects and interaction feedback throughout the app
              </Text>

              {/* Enable/Disable Sounds */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Enable Sounds</Text>
                  <Text style={styles.settingDescription}>
                    Play audio feedback for buttons, forms, and interactions
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={handleToggleSound}
                  disabled={isLoading}
                  trackColor={{ 
                    false: theme.colors.gray.light, 
                    true: theme.colors.primary + '40' 
                  }}
                  thumbColor={isEnabled ? theme.colors.primary : theme.colors.gray.medium}
                />
              </View>

              {/* Volume Control */}
              <View style={[styles.settingRow, { opacity: isEnabled ? 1 : 0.5 }]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Volume</Text>
                  <Text style={styles.settingDescription}>
                    Adjust global volume for all sound effects ({Math.round(globalVolume * 100)}%)
                  </Text>
                </View>
              </View>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Quiet</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.1}
                  maximumValue={1.0}
                  value={globalVolume}
                  onValueChange={handleVolumeChange}
                  onSlidingComplete={handleVolumeChangeComplete}
                  disabled={!isEnabled || isLoading}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.gray.light}
                  thumbStyle={{ backgroundColor: theme.colors.primary }}
                />
                <Text style={styles.sliderLabel}>Loud</Text>
              </View>
            </PremiumCard>
          </Animated.View>

          {/* Sound Test Card */}
          <Animated.View 
            style={[
              {
                opacity: testCardAnim,
                transform: [{
                  translateY: testCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.testCard,
              {
                elevation: Number(testShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] })),
                shadowOpacity: Number(testShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] })),
              }
            ]}>
              <Text style={styles.cardTitle}>Test Sounds</Text>
              <Text style={styles.cardSubtitle}>
                Preview different sound effects used throughout the app
              </Text>

              {testSounds.map((sound, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.testButton,
                    !isEnabled && styles.testButtonDisabled
                  ]}
                  onPress={() => handleTestSound(sound.action, sound.name)}
                  disabled={!isEnabled}
                >
                  <View style={styles.testButtonContent}>
                    <Text style={[
                      styles.testButtonTitle,
                      !isEnabled && styles.testButtonTitleDisabled
                    ]}>
                      {sound.name}
                    </Text>
                    <Text style={[
                      styles.testButtonDescription,
                      !isEnabled && styles.testButtonDescriptionDisabled
                    ]}>
                      {sound.description}
                    </Text>
                  </View>
                  <SvgIcon
                    name="play"
                    size={18}
                    color={isEnabled ? theme.colors.primary : theme.colors.text.disabled}
                    style={[
                      styles.testButtonIcon,
                      !isEnabled && styles.testButtonIconDisabled
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </PremiumCard>
          </Animated.View>

          {/* Reset Button */}
          <View style={styles.resetContainer}>
            <PremiumButton
              title="Reset to Defaults"
              onPress={resetToDefaults}
              variant="secondary"
              disabled={isLoading}
              style={styles.resetButton}
            />
          </View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
  },

  // Cards
  settingsCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, // Premium card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  testCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  settingLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },

  // Slider
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: theme.spacing[3],
  },
  sliderLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Test Buttons
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[3],
    marginBottom: theme.spacing[2],
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  testButtonDisabled: {
    backgroundColor: theme.colors.gray.light,
    borderColor: theme.colors.gray.light,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  testButtonTitleDisabled: {
    color: theme.colors.text.disabled,
  },
  testButtonDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  testButtonDescriptionDisabled: {
    color: theme.colors.text.disabled,
  },
  testButtonIcon: {
    marginLeft: theme.spacing[2],
  },
  testButtonIconDisabled: {
    opacity: 0.3,
  },

  // Reset
  resetContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  resetButton: {
    width: '100%',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 50,
  },
});

export default SoundSettingsScreen;
