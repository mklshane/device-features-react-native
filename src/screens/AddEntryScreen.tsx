import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { saveEntry } from '../utils/storage';
import { LocationData } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { AddEntryScreenProps } from '../navigation/props';
import { requestAllPermissions } from '../utils/permissions';
import { ConfirmDeleteModal } from '../components/Base/ConfirmDeleteModal';

const DESCRIPTION_MAX_LENGTH = 140;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const AddEntryScreen = ({ navigation }: AddEntryScreenProps) => {
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionHint, setPermissionHint] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [description, setDescription] = useState('');
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const descriptionY = useRef(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<React.ElementRef<typeof CameraView> | null>(null);

  const clearDraft = useCallback(() => {
    setImageUri(null);
    setLocation(null);
    setDescription('');
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const preparePermissions = async () => {
        try {
          const permissionSummary = await requestAllPermissions();

          if (!isActive) {
            return;
          }

          let hintMessage = '';

          if (!permissionSummary.locationGranted) {
            hintMessage = 'Location access is needed when you save a memory.';
          }

          if (!permissionSummary.cameraGranted && !permissionSummary.mediaLibraryGranted) {
            hintMessage = 'Camera and gallery permissions are needed to add a photo.';
          }

          if (!permissionSummary.notificationGranted) {
            hintMessage = hintMessage || 'Notifications are optional.';
          }

          setPermissionHint(hintMessage);
        } catch {
          if (isActive) {
            setPermissionHint('Could not verify permissions. You can retry while capturing a memory.');
          }
        }
      };

      preparePermissions();

      return () => {
        isActive = false;
        clearDraft();
      };
    }, [clearDraft])
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const captureDescriptionPosition = (event: LayoutChangeEvent) => {
    descriptionY.current = event.nativeEvent.layout.y;
  };

  const scrollDescriptionIntoView = useCallback((extraOffset = 0) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, descriptionY.current - (120 + extraOffset)),
        animated: true,
      });
    });
  }, []);

  const handleDescriptionFocus = () => {
    setDescriptionFocused(true);
    scrollDescriptionIntoView();
  };

  const handleDescriptionBlur = () => {
    setDescriptionFocused(false);
  };

  useEffect(() => {
    if (!descriptionFocused || keyboardHeight <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      scrollDescriptionIntoView(keyboardHeight * 0.2);
    }, 80);

    return () => clearTimeout(timeout);
  }, [descriptionFocused, keyboardHeight, scrollDescriptionIntoView]);

  const openCamera = async () => {
    try {
      const hasPermission = cameraPermission?.granted;
      if (!hasPermission) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Permission Denied', 'Please grant camera access to take a picture.');
          return;
        }
      }

      setShowCameraModal(true);
    } catch {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const takePicture = async () => {
    try {
      if (!cameraRef.current) {
        return;
      }

      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (result?.uri) {
        setShowCameraModal(false);
        setTorchEnabled(false);
        setImageUri(result.uri);
        await fetchLocation();
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant photo library access to choose a picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShowCameraModal(false);
        setTorchEnabled(false);
        setImageUri(result.assets[0].uri);
        await fetchLocation();
      }
    } catch {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to tag your memory.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      let addressString = '';

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        if (geocode.length > 0) {
          const place = geocode[0];
          addressString = [place.city, place.region, place.country].filter(Boolean).join(', ');
        }
      } catch (e) {
        console.warn('Geocoding failed', e);
      }

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: addressString,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch location');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!imageUri || !location) {
      Alert.alert('Missing Info', 'Please add an image and wait for location to load.');
      return;
    }

    try {
      setLoading(true);
      const trimmedDescription = description.trim();
      const entry = {
        id: Date.now().toString(),
        imageUri,
        location,
        timestamp: Date.now(),
        description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
      };

      await saveEntry(entry);
      
      const notifyPerm = await Notifications.requestPermissionsAsync();
      if (notifyPerm.status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Travel Diary',
            body: 'New travel memory saved!',
          },
          trigger: null,
        });
      }

      clearDraft();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not save the entry.');
      setLoading(false);
    }
  };

  const handleCancelPress = () => {
    if (imageUri) {
      setShowCancelModal(true);
      return;
    }

    clearDraft();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.innerContainer}>
          <KeyboardAvoidingView
            style={styles.contentWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.content, { paddingBottom: 136 + keyboardHeight }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              {permissionHint ? (
                <View style={[styles.permissionNotice, { borderColor: colors.border }]}>
                  <Text style={[styles.permissionNoticeText, { color: colors.textSecondary }]}>
                    {permissionHint}
                  </Text>
                </View>
              ) : null}

              {!imageUri ? (
                <TouchableOpacity
                  style={[styles.cameraPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={openCamera}
                >
                  <Ionicons name="camera" size={48} color={colors.primary} />
                  <Text style={[styles.cameraText, { color: colors.textSecondary }]}>Capture Memory</Text>
                  <Text style={[styles.cameraSubtext, { color: colors.textSecondary }]}>Tap to add a photo</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.retakeButton} onPress={openCamera}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
              ) : (
                location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.text }]}>
                      {location.address || 'Unknown Location'}
                    </Text>
                  </View>
                )
              )}

              <View style={styles.descriptionSection} onLayout={captureDescriptionPosition}>
                <Text style={[styles.descriptionLabel, { color: colors.text }]}>Description (optional)</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add a short note about this memory"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  style={[
                    styles.descriptionInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  textAlignVertical="top"
                  onFocus={handleDescriptionFocus}
                  onBlur={handleDescriptionBlur}
                />
                <Text style={[styles.descriptionCount, { color: colors.textSecondary }]}>
                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={handleCancelPress}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: !imageUri || !location ? colors.border : colors.primary },
              ]}
              onPress={handleSave}
              disabled={!imageUri || !location || loading}
            >
              <Text style={[styles.saveButtonText, { color: !imageUri || !location ? colors.textSecondary : '#FFF' }]}>
                Save Entry
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => {
          setShowCameraModal(false);
          setTorchEnabled(false);
        }}
      >
        <View style={styles.cameraModalContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing={cameraFacing}
            enableTorch={torchEnabled}
          >
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>New Memory</Text>
              <View style={styles.cameraHeaderActions}>
                <Pressable
                  style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  onPress={() => setTorchEnabled((value) => !value)}
                  hitSlop={10}
                >
                  <Ionicons name={torchEnabled ? 'flash' : 'flash-off'} size={22} color="#FFF" />
                </Pressable>

                <Pressable
                  style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  onPress={() => setCameraFacing((value) => (value === 'back' ? 'front' : 'back'))}
                  hitSlop={10}
                >
                  <Ionicons name="camera-reverse" size={22} color="#FFF" />
                </Pressable>

                <Pressable
                  style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  onPress={() => {
                    setShowCameraModal(false);
                    setTorchEnabled(false);
                  }}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <View style={styles.cameraActionColumn}>
                <Pressable
                  style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  onPress={pickImageFromGallery}
                  hitSlop={10}
                >
                  <Ionicons name="images" size={22} color="#FFF" />
                </Pressable>
                <Text style={styles.cameraActionLabel}>Gallery</Text>
              </View>

              <View style={styles.captureColumn}>
                <Pressable style={styles.captureButtonOuter} onPress={takePicture} hitSlop={10}>
                  <View style={styles.captureButtonInner} />
                </Pressable>
                <Text style={styles.captureLabel}>Capture</Text>
              </View>

              <View style={styles.cameraIconSpacer} />
            </View>
          </CameraView>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={showCancelModal}
        title="Discard this memory?"
        message="Your captured photo and fetched location will be cleared if you cancel now."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        accentColor={colors.primary}
        backgroundColor={colors.card}
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
        borderColor={colors.border}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          clearDraft();
          navigation.goBack();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1, padding: 24 },
  contentWrapper: { flex: 1 },
  content: { flexGrow: 1 },
  permissionNotice: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  permissionNoticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  cameraPlaceholder: {
    height: 350,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: { fontFamily: 'Inter_600SemiBold', marginTop: 16, fontSize: 16 },
  cameraSubtext: { fontFamily: 'Inter_400Regular', marginTop: 6, fontSize: 13 },
  imageContainer: {
    height: 350,
    borderRadius: 24,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  retakeButton: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10, borderRadius: 20,
  },
  loader: { marginTop: 32 },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  locationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
  descriptionSection: {
    marginTop: 20,
  },
  descriptionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  descriptionCount: {
    marginTop: 6,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  footerActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cameraModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraTitle: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  cameraFooter: {
    paddingHorizontal: 28,
    paddingBottom: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cameraActionColumn: {
    alignItems: 'center',
    width: 64,
  },
  captureColumn: {
    alignItems: 'center',
  },
  cameraIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActionLabel: {
    marginTop: 8,
    color: '#FFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  cameraIconSpacer: {
    width: 64,
    height: 64,
  },
  captureButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
  captureLabel: {
    marginTop: 10,
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});