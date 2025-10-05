import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { theme } from '../../constants/theme';
import { MainTabParamList } from '../../types/navigation';
import { StandardHeader } from '../../components';

type CertificateViewerScreenNavigationProp = StackNavigationProp<MainTabParamList, 'CertificateViewer'>;
type CertificateViewerScreenRouteProp = RouteProp<MainTabParamList, 'CertificateViewer'>;

interface Props {
  navigation: CertificateViewerScreenNavigationProp;
  route: CertificateViewerScreenRouteProp;
}

const AnimatedImage = Animated.createAnimatedComponent(ScrollView);

export const CertificateViewerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUri } = route.params;
  
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);

  const pinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      baseScale.value = scale.value;
    },
    onActive: (event) => {
      scale.value = baseScale.value * event.scale;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
    },
  });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleShare = async () => {
    if (!imageUri) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
      }
      
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Certificate',
      });
    } catch (error) {
      __DEV__ && console.error('Error sharing certificate:', error);
      Alert.alert('Error', 'Failed to share certificate.');
    }
  };

  const handleClose = () => {
    // Ensure we go back to the previous screen in the CME stack

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: navigate to CMEHistory within the same stack

      navigation.navigate('CMEHistory');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StandardHeader
        title="Certificate"
        onBackPress={handleClose}
        rightIcon="share"
        rightIconPress={handleShare}
        rightIconColor="#FFFFFF"
        rightIconSize={24}
      />

      <View style={styles.imageContainer}>
        <PinchGestureHandler onGestureEvent={pinchHandler}>
          <Animated.View style={styles.imageWrapper}>
            <Animated.Image 
              source={{ uri: imageUri }}
              style={[styles.image, imageStyle]}
              resizeMode="contain"
            />
          </Animated.View>
        </PinchGestureHandler>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Pinch to zoom
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.background,
    opacity: 0.8,
  },
});