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
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

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
}

export const Input: React.FC<InputProps> = ({
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
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState<number | undefined>(undefined);
  const textInputRef = useRef<TextInput>(null);
  const focusAnimation = useSharedValue(0);
  const errorAnimation = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnimation.value = withTiming(1, {
      duration: theme.animation.duration.fast,
    });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
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

  // Auto-expansion logic for multiline inputs
  const handleContentSizeChange = (event: any) => {
    if (!autoExpand || !multiline) return;
    
    const { height } = event.nativeEvent.contentSize;
    const lineHeight = (theme.typography.lineHeight.normal * theme.typography.fontSize.base) || 20;
    const paddingVertical = theme.spacing[3] * 2; // Top + bottom padding
    
    // Calculate height based on content, respecting min and max lines
    const minHeight = (lineHeight * minLines) + paddingVertical;
    const maxHeight = (lineHeight * maxLines) + paddingVertical;
    
    const newHeight = Math.max(minHeight, Math.min(height + paddingVertical, maxHeight));
    
    setInputHeight(newHeight);
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
    transform: [
      {
        translateY: errorAnimation.value * -5,
      },
    ],
  }));

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      paddingVertical: autoExpand && multiline ? theme.spacing[3] : 0,
    };

    if (autoExpand && multiline) {
      baseStyle.textAlignVertical = 'top';
      if (inputHeight) {
        baseStyle.height = inputHeight - (theme.spacing[3] * 2); // Subtract container padding
      }
    }

    return baseStyle;
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.inputContainer,
      height: autoExpand && multiline && inputHeight ? inputHeight : theme.layout.inputHeight,
      alignItems: autoExpand && multiline ? 'flex-start' : 'center',
      paddingVertical: autoExpand && multiline ? theme.spacing[3] : theme.spacing[0],
    };

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
          multiline={autoExpand ? true : multiline}
          scrollEnabled={autoExpand && multiline ? false : undefined}
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
};

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