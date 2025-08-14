import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';

export const OfflineIndicator: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      
      if (isConnected === null) {
        // First time loading - don't show anything
        setIsConnected(connected);
        return;
      }
      
      if (isConnected && !connected) {
        // Just went offline
        setIsConnected(connected);
        setShowIndicator(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!isConnected && connected) {
        // Just came back online
        setIsConnected(connected);
        // Show "Back online" briefly, then fade out
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowIndicator(false);
          });
        }, 2000);
      }
    });

    return unsubscribe;
  }, [isConnected, fadeAnim]);

  if (!showIndicator) {
    return null;
  }

  const isOffline = !isConnected;

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim },
        isOffline ? styles.offlineContainer : styles.onlineContainer
      ]}
    >
      <Text style={[styles.text, isOffline ? styles.offlineText : styles.onlineText]}>
        {isOffline ? '📱 Working Offline' : '🌐 Back Online'}
      </Text>
      <Text style={[styles.subtext, isOffline ? styles.offlineText : styles.onlineText]}>
        {isOffline 
          ? 'All features available offline' 
          : 'Connection restored'
        }
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: theme.spacing[4],
    zIndex: 1000,
    elevation: 1000,
  },
  offlineContainer: {
    backgroundColor: '#FF6B6B',
  },
  onlineContainer: {
    backgroundColor: '#51CF66',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  offlineText: {
    color: '#FFFFFF',
  },
  onlineText: {
    color: '#FFFFFF',
  },
});