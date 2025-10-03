import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { HapticsUtils } from '../../utils/HapticsUtils';
import { SvgIcon } from './SvgIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      __DEV__ && console.error('[ERROR] ErrorBoundary: Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Trigger haptic feedback for errors
    HapticsUtils.error();

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    HapticsUtils.light();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <SvgIcon name="alert" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: theme.spacing[5],
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: 8,
    marginBottom: theme.spacing[4],
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.gray[100],
    borderRadius: 4,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray[900],
    marginBottom: theme.spacing[2],
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
