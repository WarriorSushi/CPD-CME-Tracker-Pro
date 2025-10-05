import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputContentSizeChangeEventData,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';
import { useSound } from '../../hooks/useSound';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  autoExpand?: boolean; // Enable WhatsApp-like auto-expansion
  minLines?: number; // Minimum number of lines to show
  maxLines?: number; // Maximum number of lines before scrolling
  enableSound?: boolean; // Enable focus sound feedback
  soundVolume?: number; // Custom volume for this input
}

export const Input = React.memo<InputProps>(({
  label,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  style,
  autoExpand = false,
  minLines = 1,
  maxLines = 8,
  multiline,
  enableSound = true,
  soundVolume,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { playFocus } = useSound({ enabled: enableSound, volume: soundVolume });
  
  // Initialize height for auto-expanding inputs
  const getInitialHeight = () => {
    if (!autoExpand) return undefined;
    const lineHeight = theme.typography.fontSize.base * theme.typography.lineHeight.normal;
    const verticalPadding = theme.spacing[3] * 2;
    return (lineHeight * minLines) + verticalPadding;
  };
  
  const [inputHeight, setInputHeight] = useState<number | undefined>(getInitialHeight());
  const textInputRef = useRef<TextInput>(null);
  const focusAnimation = useSharedValue(0);
  const errorAnimation = useSharedValue(0);

  const handleFocus = async (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    
    // Play subtle focus sound
    if (enableSound) {
      await playFocus();
    }
    
    focusAnimation.value = withTiming(1, {
      duration: theme.animation.duration.fast,
    });
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    focusAnimation.value = withTiming(0, {
      duration: theme.animation.duration.fast,
    });
    onBlur?.(e);
  };

  React.useEffect(() => {
    errorAnimation.value = withTiming(error ? 1 : 0, {
      duration: theme.animation.duration.medium,
    });
  }, [error]);

  // Optimized auto-expansion using shared values for better performance
  const animatedHeight = useSharedValue<number | null>(null);

  // Memoize calculations to avoid recalculating on every render
  const verticalPadding = theme.spacing[3] * 2;
  const lineHeight = theme.typography.fontSize.base * theme.typography.lineHeight.normal;
  const minContentHeight = lineHeight * minLines;
  const maxContentHeight = lineHeight * maxLines;

  const [shouldScroll, setShouldScroll] = useState(false);

  const handleContentSizeChange = (event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    if (!autoExpand) return;

    const { height } = event.nativeEvent.contentSize;

    // Constrain content height to boundaries (single calculation)
    const constrainedContentHeight = Math.max(
      minContentHeight,
      Math.min(height, maxContentHeight)
    );

    const newHeight = constrainedContentHeight + verticalPadding;

    // Enable scrolling when content reaches max height
    setShouldScroll(height >= maxContentHeight);

    // Use animated value for smooth transitions
    if (animatedHeight.value === null || Math.abs(newHeight - animatedHeight.value) > 2) {
      animatedHeight.value = withTiming(newHeight, {
        duration: 150, // Smooth but quick animation
      });
      setInputHeight(newHeight);
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? theme.colors.error
      : focusAnimation.value > 0
      ? theme.colors.primary
      : theme.colors.border.light;

    const borderWidth = focusAnimation.value > 0 ? 2 : 1;

    return {
      borderColor,
      borderWidth,
    };
  });

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: errorAnimation.value,
  }));

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      paddingVertical: 0, // Let container handle padding
      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    };

    if (autoExpand) {
      baseStyle.textAlignVertical = 'top';
      // Ensure text input fills the container height
      baseStyle.minHeight = '100%';
    }

    return baseStyle;
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.inputContainer,
      alignItems: autoExpand ? 'flex-start' : 'center',
      paddingVertical: autoExpand ? theme.spacing[3] : theme.spacing[0],
    };

    // Apply dynamic height for auto-expanding inputs
    if (autoExpand) {
      if (inputHeight) {
        baseStyle.height = inputHeight;
      } else {
        // Initial height calculation
        const lineHeight = theme.typography.fontSize.base * theme.typography.lineHeight.normal;
        const verticalPadding = theme.spacing[3] * 2;
        baseStyle.height = (lineHeight * minLines) + verticalPadding;
      }
    } else {
      baseStyle.height = theme.layout.inputHeight;
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[getContainerStyle(), animatedBorderStyle]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          ref={textInputRef}
          style={[getInputStyle(), style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onContentSizeChange={handleContentSizeChange}
          multiline={autoExpand || multiline}
          scrollEnabled={autoExpand ? shouldScroll : (props.scrollEnabled ?? true)}
          placeholderTextColor={theme.colors.text.disabled}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Animated.View>

      {error && (
        <Animated.Text style={[styles.errorText, animatedErrorStyle]}>
          {error}
        </Animated.Text>
      )}
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing[2],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  inputContainer: {
    height: theme.layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Pure white for input fields
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  leftIcon: {
    marginRight: theme.spacing[2],
  },
  rightIcon: {
    marginLeft: theme.spacing[2],
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[1],
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[1],
  },
});

export default Input;