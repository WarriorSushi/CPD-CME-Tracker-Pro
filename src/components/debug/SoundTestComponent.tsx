import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PremiumButton } from '../../screens/onboarding/OnboardingComponents';
import { useSound } from '../../hooks/useSound';
import { soundManager } from '../../services/sound/SoundManager';
import { theme } from '../../constants/theme';

export const SoundTestComponent: React.FC = () => {
  const { 
    playButtonTap, 
    playButtonPress, 
    playSuccess, 
    playError, 
    playEntryAdd,
    playFormSubmit 
  } = useSound();

  const soundTests = [
    {
      title: 'Button Press',
      description: 'button-press.mp3 at 0.25 volume',
      action: playButtonPress,
    },
    {
      title: 'Button Tap (Light)',
      description: 'button-press.mp3 at 0.15 volume',
      action: playButtonTap,
    },
    {
      title: 'Navigation Swipe',
      description: 'navigation-swipe.mp3 at 0.18 volume',
      action: () => soundManager.play('navigationSwipe'),
    },
    {
      title: 'Success (Entry Add)',
      description: 'entry-add.mp3 at 0.35 volume',
      action: playSuccess,
    },
    {
      title: 'Error',
      description: 'error.mp3 at 0.3 volume',
      action: playError,
    },
    {
      title: 'Entry Added',
      description: 'entry-add.mp3 at 0.3 volume',
      action: playEntryAdd,
    },
    {
      title: 'Entry Deleted',
      description: 'entry-delete.mp3 at 0.25 volume',
      action: () => soundManager.play('entryDelete'),
    },
    {
      title: 'Notification',
      description: 'notification.mp3 at 0.25 volume',
      action: () => soundManager.play('notification'),
    },
    {
      title: 'Form Submit',
      description: 'button-press.mp3 at 0.28 volume',
      action: playFormSubmit,
    },
    {
      title: 'Modal Open',
      description: 'navigation-swipe.mp3 at 0.15 volume',
      action: () => soundManager.play('modalOpen'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎵 Sound System Test</Text>
      <Text style={styles.subtitle}>
        Testing all sound mappings with your audio files
      </Text>
      
      {soundTests.map((test, index) => (
        <View key={index} style={styles.testItem}>
          <View style={styles.testInfo}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <Text style={styles.testDescription}>{test.description}</Text>
          </View>
          <PremiumButton
            title="Play"
            onPress={test.action}
            variant="primary"
            enableSound={false} // Disable button's own sound to test specific sound
            style={styles.playButton}
          />
        </View>
      ))}
      
      <View style={styles.info}>
        <Text style={styles.infoTitle}>📁 Available Files:</Text>
        <Text style={styles.infoText}>
          • button-press.mp3 (11KB){'\n'}
          • entry-add.mp3 (35KB){'\n'}
          • entry-delete.mp3 (31KB){'\n'}
          • error.mp3 (17KB){'\n'}
          • navigation-swipe.mp3 (27KB){'\n'}
          • notification.mp3 (98KB)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[3],
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  testInfo: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  testTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  testDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  playButton: {
    minWidth: 80,
  },
  info: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.accent,
    borderRadius: theme.spacing[2],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default SoundTestComponent;