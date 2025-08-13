import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { SvgIcon, IconName } from './SvgIcon';

interface StandardHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightIcon?: IconName;
  rightIconPress?: () => void;
  rightText?: string;
  rightTextPress?: () => void;
  style?: ViewStyle;
  showBackButton?: boolean;
}

export const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  onBackPress,
  rightIcon,
  rightIconPress,
  rightText,
  rightTextPress,
  style,
  showBackButton = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + theme.spacing[4] }, style]}>
      <View style={styles.headerContent}>
        {/* Left - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton && onBackPress && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBackPress}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right - Icon or Text */}
        <View style={styles.rightSection}>
          {rightIcon && rightIconPress && (
            <TouchableOpacity 
              style={styles.rightButton}
              onPress={rightIconPress}
              accessibilityLabel={`${rightIcon} button`}
              accessibilityRole="button"
            >
              <SvgIcon 
                name={rightIcon}
                size={24}
                color={theme.colors.background}
              />
            </TouchableOpacity>
          )}
          {rightText && rightTextPress && (
            <TouchableOpacity 
              onPress={rightTextPress}
              accessibilityLabel={rightText}
              accessibilityRole="button"
            >
              <Text style={styles.rightText}>{rightText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#003087', // HSL(215°, 100%, 26%)
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    borderBottomLeftRadius: theme.spacing[3],
    borderBottomRightRadius: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44, // Minimum touch target
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  backButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.spacing[2],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: theme.colors.background,
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.medium,
  },
  headerTitle: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  rightButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.spacing[2],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
});