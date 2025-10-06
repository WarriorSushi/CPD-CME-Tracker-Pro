import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, GestureResponderEvent } from 'react-native';
import { useSound } from '../../hooks/useSound';
import { SoundType } from '../../services/sound/SoundManager';

interface SoundButtonProps extends TouchableOpacityProps {
  soundType?: SoundType;
  enableSound?: boolean;
  soundVolume?: number;
  children: React.ReactNode;
  hapticFeedback?: boolean;
}

export const SoundButton: React.FC<SoundButtonProps> = ({
  soundType = 'buttonTap',
  enableSound = true,
  soundVolume,
  onPress,
  children,
  hapticFeedback = false,
  ...props
}) => {
  const { playSound } = useSound({ enabled: enableSound, volume: soundVolume });

  const handlePress = (event: GestureResponderEvent) => {
    // Play sound first for immediate feedback
    if (enableSound) {
      void playSound(soundType, soundVolume);
    }

    // Add haptic feedback if requested (iOS/Android)
    if (hapticFeedback) {
      // Note: Would need expo-haptics for this
      // HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
    }

    // Call the original onPress handler
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      activeOpacity={props.activeOpacity ?? 0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

export default SoundButton;


