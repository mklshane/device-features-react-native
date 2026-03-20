import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { saveEntry } from '../utils/storage';
import { LocationData } from '../types';
import { AddEntryScreenProps } from '../navigation/props';
import { requestAllPermissions } from '../utils/permissions';
import { ConfirmDeleteModal } from '../components/Base/ConfirmDeleteModal';
import { ImageSection } from '../components/AddEntry/ImageSection';
import { LocationSection } from '../components/AddEntry/LocationSection';
import { DescriptionSection } from '../components/AddEntry/DescriptionSection';
import { FooterActions } from '../components/AddEntry/FooterActions';
import { PhotoSourceModal } from '../components/AddEntry/PhotoSourceModal';

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
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [description, setDescription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const descriptionY = useRef(0);

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

  const openPhotoSourceModal = () => {
    setShowPhotoSourceModal(true);
  };

  const toSignedCoordinate = (value: unknown, ref: unknown) => {
    const parseCoordinatePart = (raw: unknown): number => {
      if (typeof raw === 'number') {
        return raw;
      }

      if (typeof raw === 'string') {
        return Number(raw);
      }

      if (raw && typeof raw === 'object') {
        const maybeRational = raw as { numerator?: unknown; denominator?: unknown };
        const numerator = Number(maybeRational.numerator);
        const denominator = Number(maybeRational.denominator);

        if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
          return numerator / denominator;
        }
      }

      return Number.NaN;
    };

    const parseCoordinate = (raw: unknown): number | null => {
      if (typeof raw === 'number') {
        return Number.isFinite(raw) ? raw : null;
      }

      if (typeof raw === 'string') {
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
      }

      if (Array.isArray(raw) && raw.length > 0) {
        const [degreesRaw, minutesRaw = 0, secondsRaw = 0] = raw;
        const degrees = parseCoordinatePart(degreesRaw);
        const minutes = parseCoordinatePart(minutesRaw);
        const seconds = parseCoordinatePart(secondsRaw);

        if ([degrees, minutes, seconds].some((num) => Number.isNaN(num))) {
          return null;
        }

        const absolute = Math.abs(degrees) + minutes / 60 + seconds / 3600;
        return degrees < 0 ? -absolute : absolute;
      }

      return null;
    };

    const coordinate = parseCoordinate(value);
    if (coordinate === null) {
      return null;
    }

    if (typeof ref !== 'string') {
      return coordinate;
    }

    const normalizedRef = ref.toUpperCase();
    if (normalizedRef === 'S' || normalizedRef === 'W') {
      return -Math.abs(coordinate);
    }

    return Math.abs(coordinate);
  };

  const extractCoordinatesFromExif = (exif?: Record<string, unknown> | null) => {
    if (!exif) {
      return null;
    }

    const latitude =
      toSignedCoordinate(exif.GPSLatitude, exif.GPSLatitudeRef) ??
      toSignedCoordinate(exif.latitude, exif.latitudeRef);
    const longitude =
      toSignedCoordinate(exif.GPSLongitude, exif.GPSLongitudeRef) ??
      toSignedCoordinate(exif.longitude, exif.longitudeRef);

    if (latitude === null || longitude === null) {
      return null;
    }

    return { latitude, longitude };
  };

  const getAddressString = async (latitude: number, longitude: number) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length === 0) {
        return '';
      }

      const place = geocode[0];
      return [place.city, place.region, place.country].filter(Boolean).join(', ');
    } catch (error) {
      console.warn('Geocoding failed', error);
      return '';
    }
  };

  const setLocationFromCoordinates = async (latitude: number, longitude: number) => {
    const address = await getAddressString(latitude, longitude);
    setLocation({ latitude, longitude, address });
  };

  const takePictureWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant camera access to take a picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      setShowPhotoSourceModal(false);

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setImageUri(result.assets[0].uri);
      await fetchCurrentLocation();
    } catch {
      Alert.alert('Error', 'Failed to open camera');
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
        // Keep EXIF metadata intact so photo GPS can be read.
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });

      setShowPhotoSourceModal(false);

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setImageUri(selectedAsset.uri);

        const imageCoordinates = extractCoordinatesFromExif(
          selectedAsset.exif as Record<string, unknown> | undefined
        );

        if (imageCoordinates) {
          await setLocationFromCoordinates(imageCoordinates.latitude, imageCoordinates.longitude);
        } else {
          await fetchCurrentLocation();
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const fetchCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to tag your memory.');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      await setLocationFromCoordinates(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
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

  const canSave = Boolean(imageUri && location);

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

              <ImageSection
                imageUri={imageUri}
                cardColor={colors.card}
                borderColor={colors.border}
                primaryColor={colors.primary}
                textSecondaryColor={colors.textSecondary}
                onOpenCamera={openPhotoSourceModal}
              />

              <LocationSection
                loading={loading}
                location={location}
                primaryColor={colors.primary}
                textColor={colors.text}
              />

              <DescriptionSection
                value={description}
                maxLength={DESCRIPTION_MAX_LENGTH}
                textColor={colors.text}
                textSecondaryColor={colors.textSecondary}
                borderColor={colors.border}
                cardColor={colors.card}
                onChangeText={setDescription}
                onFocus={handleDescriptionFocus}
                onBlur={handleDescriptionBlur}
                onLayout={captureDescriptionPosition}
              />
            </ScrollView>
          </KeyboardAvoidingView>

          <FooterActions
            canSave={canSave}
            loading={loading}
            primaryColor={colors.primary}
            borderColor={colors.border}
            cardColor={colors.card}
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
            onCancel={handleCancelPress}
            onSave={handleSave}
          />
        </View>
      </TouchableWithoutFeedback>

      <PhotoSourceModal
        visible={showPhotoSourceModal}
        accentColor={colors.primary}
        backgroundColor={colors.card}
        textColor={colors.text}
        secondaryTextColor={colors.textSecondary}
        borderColor={colors.border}
        onClose={() => setShowPhotoSourceModal(false)}
        onChooseCamera={takePictureWithCamera}
        onChooseUpload={pickImageFromGallery}
      />

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
});