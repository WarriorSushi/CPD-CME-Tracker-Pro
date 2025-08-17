import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundType = 
  | 'buttonTap' 
  | 'buttonPress' 
  | 'navigationSwipe'
  | 'success' 
  | 'error' 
  | 'notification'
  | 'modalOpen'
  | 'modalClose'
  | 'formSubmit'
  | 'entryAdd'
  | 'entryDelete'
  | 'refresh'
  | 'toggle'
  | 'focus';

interface SoundConfig {
  file: any; // require() result
  volume: number;
  rate?: number;
  cached?: Audio.Sound;
}

class SoundManager {
  private sounds: Map<SoundType, SoundConfig> = new Map();
  private isEnabled: boolean = true;
  private globalVolume: number = 0.3; // Low volume by default for aesthetic, unintrusive experience
  private isInitialized: boolean = false;

  constructor() {
    this.loadSettings();
    this.initializeSounds();
  }

  private async loadSettings() {
    try {
      const soundEnabled = await AsyncStorage.getItem('sound_enabled');
      const soundVolume = await AsyncStorage.getItem('sound_volume');
      
      this.isEnabled = soundEnabled !== 'false'; // Default to true
      this.globalVolume = soundVolume ? parseFloat(soundVolume) : 0.3;
    } catch (error) {
      __DEV__ && console.warn('Failed to load sound settings:', error);
    }
  }

  private initializeSounds() {
    // Apple-inspired sound mappings with very low, aesthetic volumes
    this.sounds.set('buttonTap', {
      file: require('../../../assets/sounds/button-tap.mp3'),
      volume: 0.2, // Very soft tap
    });

    this.sounds.set('buttonPress', {
      file: require('../../../assets/sounds/button-press.mp3'),
      volume: 0.25, // Slightly more prominent for primary actions
    });

    this.sounds.set('navigationSwipe', {
      file: require('../../../assets/sounds/navigation-swipe.mp3'),
      volume: 0.15, // Very subtle for navigation
    });

    this.sounds.set('success', {
      file: require('../../../assets/sounds/success.mp3'),
      volume: 0.4, // More noticeable for positive feedback
    });

    this.sounds.set('error', {
      file: require('../../../assets/sounds/error.mp3'),
      volume: 0.35, // Noticeable but not harsh
    });

    this.sounds.set('notification', {
      file: require('../../../assets/sounds/notification.mp3'),
      volume: 0.3, // Balanced for alerts
    });

    this.sounds.set('modalOpen', {
      file: require('../../../assets/sounds/modal-open.mp3'),
      volume: 0.2, // Subtle for modal appearance
    });

    this.sounds.set('modalClose', {
      file: require('../../../assets/sounds/modal-close.mp3'),
      volume: 0.18, // Even more subtle for dismissal
    });

    this.sounds.set('formSubmit', {
      file: require('../../../assets/sounds/form-submit.mp3'),
      volume: 0.25, // Confirming but not overwhelming
    });

    this.sounds.set('entryAdd', {
      file: require('../../../assets/sounds/entry-add.mp3'),
      volume: 0.3, // Positive reinforcement
    });

    this.sounds.set('entryDelete', {
      file: require('../../../assets/sounds/entry-delete.mp3'),
      volume: 0.25, // Subtle for destructive actions
    });

    this.sounds.set('refresh', {
      file: require('../../../assets/sounds/refresh.mp3'),
      volume: 0.2, // Very subtle for data refresh
    });

    this.sounds.set('toggle', {
      file: require('../../../assets/sounds/toggle.mp3'),
      volume: 0.22, // Clear but soft for switches
    });

    this.sounds.set('focus', {
      file: require('../../../assets/sounds/focus.mp3'),
      volume: 0.15, // Very subtle for input focus
    });

    this.isInitialized = true;
  }

  async preloadSounds() {
    if (!this.isEnabled) return;

    try {
      // Set audio mode for optimal UI sound playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
        playsInSilentModeIOS: false, // Respect user's silent mode
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      // Preload frequently used sounds
      const frequentSounds: SoundType[] = ['buttonTap', 'buttonPress', 'success'];
      
      for (const soundType of frequentSounds) {
        try {
          await this.preloadSound(soundType);
        } catch (soundError) {
          __DEV__ && console.warn(`Failed to preload ${soundType}:`, soundError);
          // Continue with other sounds even if one fails
        }
      }

      __DEV__ && console.log('✅ Sound system initialized successfully');
    } catch (error) {
      __DEV__ && console.warn('Failed to initialize sound system:', error);
      // Disable sounds if initialization fails completely
      this.isEnabled = false;
    }
  }

  private async preloadSound(soundType: SoundType) {
    const config = this.sounds.get(soundType);
    if (!config || config.cached) return;

    try {
      const { sound } = await Audio.Sound.createAsync(config.file, {
        shouldPlay: false,
        volume: config.volume * this.globalVolume,
        rate: config.rate || 1.0,
      });
      
      config.cached = sound;
    } catch (error) {
      __DEV__ && console.warn(`Failed to preload sound ${soundType}:`, error);
      // Mark as failed to prevent repeated attempts
      config.cached = null;
    }
  }

  async play(soundType: SoundType, options?: { volume?: number; rate?: number }) {
    if (!this.isEnabled || !this.isInitialized) return;

    const config = this.sounds.get(soundType);
    if (!config) {
      __DEV__ && console.warn(`Sound ${soundType} not found`);
      return;
    }

    // Skip if we know this sound failed to load
    if (config.cached === null) return;

    try {
      let sound = config.cached;
      
      if (!sound) {
        // Create sound on-demand if not preloaded
        const result = await Audio.Sound.createAsync(config.file, {
          shouldPlay: false,
          volume: (options?.volume ?? config.volume) * this.globalVolume,
          rate: options?.rate ?? config.rate ?? 1.0,
        });
        sound = result.sound;
      } else {
        // Update volume if specified
        if (options?.volume) {
          await sound.setVolumeAsync(options.volume * this.globalVolume);
        }
        if (options?.rate) {
          await sound.setRateAsync(options.rate, true);
        }
      }

      // Play the sound
      await sound.replayAsync();

      // Clean up non-cached sounds after playing
      if (!config.cached) {
        sound.unloadAsync();
      }
    } catch (error) {
      __DEV__ && console.warn(`Failed to play sound ${soundType}:`, error);
      // Mark as failed to prevent repeated attempts
      config.cached = null;
    }
  }

  // Convenience methods for common interactions
  async playButtonTap() {
    return this.play('buttonTap');
  }

  async playButtonPress() {
    return this.play('buttonPress');
  }

  async playSuccess() {
    return this.play('success');
  }

  async playError() {
    return this.play('error');
  }

  async playNavigation() {
    return this.play('navigationSwipe');
  }

  async playModalOpen() {
    return this.play('modalOpen');
  }

  async playModalClose() {
    return this.play('modalClose');
  }

  async playEntryAdd() {
    return this.play('entryAdd');
  }

  async playEntryDelete() {
    return this.play('entryDelete');
  }

  async playFormSubmit() {
    return this.play('formSubmit');
  }

  async playRefresh() {
    return this.play('refresh');
  }

  async playToggle() {
    return this.play('toggle');
  }

  async playFocus() {
    return this.play('focus');
  }

  // Settings management
  async setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    await AsyncStorage.setItem('sound_enabled', enabled.toString());
  }

  async setGlobalVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
    await AsyncStorage.setItem('sound_volume', this.globalVolume.toString());
    
    // Update cached sounds with new volume
    for (const [soundType, config] of this.sounds.entries()) {
      if (config.cached) {
        await config.cached.setVolumeAsync(config.volume * this.globalVolume);
      }
    }
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Clean up resources
  async dispose() {
    for (const [, config] of this.sounds.entries()) {
      if (config.cached) {
        await config.cached.unloadAsync();
      }
    }
    this.sounds.clear();
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
export default soundManager;