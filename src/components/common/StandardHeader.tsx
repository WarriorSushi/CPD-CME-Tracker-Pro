import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { SvgIcon, IconName } from './SvgIcon';
import { Button } from './Button';

interface StandardHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightIcon?: IconName;
  rightIconPress?: () => void;
  rightIconColor?: string;
  rightIconSize?: number;
  rightText?: string;
  rightTextPress?: () => void;
  rightTextStyle?: 'default' | 'button';
  rightButton?: boolean; // Use actual Button component instead of text
  style?: ViewStyle;
  showBackButton?: boolean;
  titleAlign?: 'center' | 'left';
  titleSize?: 'sm' | 'base' | 'lg' | 'xl';
}

export const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  onBackPress,
  rightIcon,
  rightIconPress,
  rightIconColor,
  rightIconSize = 24,
  rightText,
  rightTextPress,
  rightTextStyle = 'default',
  rightButton = false,
  style,
  showBackButton = true,
  titleAlign = 'center',
  titleSize = 'xl',
}) => {
  // Use theme color as default, evaluated inside component
  const iconColor = rightIconColor || theme.colors.background;
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
      />
      <LinearGradient
        colors={['#003087', '#001a4d']} // Current blue to darker blue
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + theme.spacing[2] }, style]}
      >
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
              <SvgIcon 
                name="backicon"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={[styles.centerSection, titleAlign === 'left' && styles.leftAligned]}>
          <Text style={[
            styles.headerTitle, 
            titleAlign === 'left' && styles.headerTitleLeft,
            { fontSize: theme.typography.fontSize[titleSize] }
          ]} numberOfLines={1}>
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
                size={rightIconSize}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
          {rightText && rightTextPress && (
            rightButton ? (
              <TouchableOpacity
                style={styles.rightButtonPrimary}
                onPress={rightTextPress}
                activeOpacity={0.8}
              >
                <Text style={styles.rightButtonPrimaryText}>{rightText}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={rightTextStyle === 'button' ? styles.rightTextButton : undefined}
                onPress={rightTextPress}
                accessibilityLabel={rightText}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.rightText,
                  rightTextStyle === 'button' && styles.rightTextButtonText
                ]}>{rightText}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    // backgroundColor removed - using LinearGradient
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[2],
    borderBottomLeftRadius: theme.borderRadius.base, // Standardized to 5px
    borderBottomRightRadius: theme.borderRadius.base, // Standardized to 5px
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32, // Reduced minimum height for more compact header
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
  leftAligned: {
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 60,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Perfect circle
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Lighter than header background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  headerTitleLeft: {
    textAlign: 'left',
  },
  rightButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.spacing[3],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rightText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  rightTextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rightTextButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  rightButtonPrimary: {
    backgroundColor: '#007AFF', // iOS blue primary color for contrast
    borderRadius: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  rightButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});