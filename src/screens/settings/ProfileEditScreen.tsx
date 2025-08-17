import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { Card, Button, Input, LoadingSpinner, StandardHeader, SvgIcon } from '../../components';
import { AnimatedGradientBackground, PremiumButton, PremiumCard } from '../onboarding/OnboardingComponents';
import { theme } from '../../constants/theme';
import { useAppContext } from '../../contexts/AppContext';
import { User, Profession } from '../../types';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateUserProfile } = useAppContext();
  
  const [profileName, setProfileName] = useState(user?.profileName || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [profession, setProfession] = useState<Profession>(user?.profession as Profession || 'Physician');
  const [profilePicturePath, setProfilePicturePath] = useState(user?.profilePicturePath || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Premium animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const profileCardAnim = useRef(new Animated.Value(0)).current;
  const infoCardAnim = useRef(new Animated.Value(0)).current;
  const previewCardAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  
  // Shadow animations (to prevent gray flash)
  const profileShadowAnim = useRef(new Animated.Value(0)).current;
  const infoShadowAnim = useRef(new Animated.Value(0)).current;
  const previewShadowAnim = useRef(new Animated.Value(0)).current;

  // Premium entrance animations
  useFocusEffect(
    useCallback(() => {
      // Premium entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 30,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Staggered content animations
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(profileCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(infoCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(previewCardAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(actionsAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Add shadows after animations finish
        Animated.parallel([
          Animated.timing(profileShadowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(infoShadowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(previewShadowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      });
    }, [])
  );

  const handleImagePicker = () => {
    Alert.alert(
      'Profile Picture',
      'Choose how you want to add your profile picture',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: handleCamera,
        },
        {
          text: 'Photo Library',
          onPress: handlePhotoLibrary,
        },
      ]
    );
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      setIsUploadingImage(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        await saveProfilePicture(result.assets[0]);
      }
    } catch (error) {
      __DEV__ && console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePhotoLibrary = async () => {
    try {
      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        await saveProfilePicture(result.assets[0]);
      }
    } catch (error) {
      __DEV__ && console.error('Photo library error:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveProfilePicture = async (imageAsset: any) => {
    try {
      // Create profile pictures directory if it doesn't exist
      const profileDir = `${FileSystem.documentDirectory}profile/`;
      const dirInfo = await FileSystem.getInfoAsync(profileDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(profileDir, { intermediates: true });
      }

      // Generate filename
      const timestamp = Date.now();
      const extension = imageAsset.uri.split('.').pop() || 'jpg';
      const fileName = `profile_picture_${timestamp}.${extension}`;
      const newFilePath = `${profileDir}${fileName}`;

      // Copy image to app documents
      await FileSystem.copyAsync({
        from: imageAsset.uri,
        to: newFilePath,
      });

      // Delete old profile picture if it exists
      if (profilePicturePath) {
        try {
          const oldFileInfo = await FileSystem.getInfoAsync(profilePicturePath);
          if (oldFileInfo.exists) {
            await FileSystem.deleteAsync(profilePicturePath);
          }
        } catch (error) {
          console.warn('Could not delete old profile picture:', error);
        }
      }

      setProfilePicturePath(newFilePath);

    } catch (error) {
      __DEV__ && console.error('Error saving profile picture:', error);
      Alert.alert('Error', 'Failed to save profile picture. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'User data not loaded. Please try again.');
      return;
    }

    // Validate age
    const ageNum = age ? parseInt(age, 10) : undefined;
    if (age && (isNaN(ageNum!) || ageNum! < 18 || ageNum! > 120)) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 18 and 120.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: Partial<User> = {
        profileName: profileName.trim() || undefined,
        age: ageNum,
        profession: profession,
        profilePicturePath: profilePicturePath || undefined,
      };

      const success = await updateUserProfile(updatedUser);
      if (success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      __DEV__ && console.error('Error updating profile:', error);
      Alert.alert('Error', 'An error occurred while updating your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProfilePicturePath('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground />
      
      <StandardHeader
        title="Edit Profile"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Picture Section */}
          <Animated.View 
            style={[
              {
                opacity: profileCardAnim,
                transform: [{
                  translateY: profileCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.profilePictureCard,
              {
                elevation: profileShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                shadowOpacity: profileShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
              }
            ]}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePictureWrapper}>
              {profilePicturePath ? (
                <Image 
                  source={{ uri: profilePicturePath }}
                  style={styles.profilePicture}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <SvgIcon 
                    name="profile" 
                    size={60} 
                    color={theme.colors.text.secondary}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.profilePictureActions}>
              <PremiumButton
                title={isUploadingImage ? "Uploading..." : profilePicturePath ? "Change Photo" : "Add Photo"}
                onPress={handleImagePicker}
                variant="primary"
                size="small"
                disabled={isUploadingImage}
                loading={isUploadingImage}
                style={styles.changePhotoButton}
              />
              
              {profilePicturePath && (
                <PremiumButton
                  title="Remove"
                  onPress={handleRemoveProfilePicture}
                  variant="secondary"
                  size="small"
                  style={styles.removePhotoButton}
                />
              )}
            </View>
          </View>
            </PremiumCard>
          </Animated.View>

          {/* Profile Information Section */}
          <Animated.View 
            style={[
              {
                opacity: infoCardAnim,
                transform: [{
                  translateY: infoCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.profileInfoCard,
              {
                elevation: infoShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
                shadowOpacity: infoShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
              }
            ]}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <Input
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Enter your display name"
              style={styles.input}
              maxLength={50}
            />
            <Text style={styles.inputHint}>
              This name will appear in your dashboard greeting
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Profession</Text>
            <View style={styles.professionSelector}>
              {(['Physician', 'Nurse', 'Pharmacist', 'Allied Health', 'Other'] as Profession[]).map((prof) => (
                <TouchableOpacity
                  key={prof}
                  style={[
                    styles.professionChip,
                    profession === prof && styles.professionChipSelected
                  ]}
                  onPress={() => setProfession(prof)}
                >
                  <Text style={[
                    styles.professionChipText,
                    profession === prof && styles.professionChipTextSelected
                  ]}>
                    {prof}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputHint}>
              Your professional designation for personalized experience
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age (Optional)</Text>
            <Input
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              keyboardType="numeric"
              style={styles.input}
              maxLength={3}
            />
            <Text style={styles.inputHint}>
              Used for personalized recommendations and statistics
            </Text>
          </View>
            </PremiumCard>
          </Animated.View>

          {/* Current Profile Preview */}
          <Animated.View 
            style={[
              {
                opacity: previewCardAnim,
                transform: [{
                  translateY: previewCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumCard style={[
              styles.previewCard,
              {
                elevation: previewShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }),
                shadowOpacity: previewShadowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] }),
              }
            ]}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContent}>
            <Text style={styles.previewText}>
              Dashboard greeting will show:
            </Text>
            <Text style={styles.previewGreeting}>
              "Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profileName.trim() || profession || 'Professional'}"
            </Text>
            <Text style={styles.previewProfession}>
              {profession}
            </Text>
          </View>
            </PremiumCard>
          </Animated.View>

          {/* Save Button */}
          <Animated.View 
            style={[
              styles.saveButtonContainer,
              {
                opacity: actionsAnim,
                transform: [{
                  translateY: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <PremiumButton
              title={isSaving ? "Saving..." : "Save Profile"}
              onPress={handleSave}
              variant="primary"
              disabled={isSaving}
              loading={isSaving}
              style={styles.saveButton}
            />
          </Animated.View>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let AnimatedGradientBackground show through
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[4],
  },

  // Profile Picture Section
  profilePictureCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: theme.spacing[3],
  },
  profilePictureWrapper: {
    marginBottom: theme.spacing[4],
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.gray.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  profilePictureActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    alignItems: 'center',
  },
  changePhotoButton: {
    minWidth: 120,
  },
  removePhotoButton: {
    minWidth: 80,
  },

  // Form Sections
  profileInfoCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  inputGroup: {
    marginBottom: theme.spacing[4],
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  input: {
    marginBottom: theme.spacing[1],
  },
  inputHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },

  // Preview Section
  previewCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.purple,
    // Shadow will be handled by animation interpolation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 0, // Start with no elevation, will be animated
    shadowOpacity: 0, // Start with no shadow, will be animated
  },
  previewContent: {
    marginTop: theme.spacing[2],
  },
  previewText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  previewGreeting: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.purple,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  // Save Button
  saveButtonContainer: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  saveButton: {
    width: '100%',
  },

  // Profession Selector
  professionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  professionChip: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background,
  },
  professionChipSelected: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  professionChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  professionChipTextSelected: {
    color: theme.colors.background,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  previewProfession: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },

  // Bottom spacer
  bottomSpacer: {
    height: 50,
  },
});