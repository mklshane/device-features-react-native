import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { saveEntry } from '../utils/storage';
import { LocationData } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { AddEntryScreenProps } from '../navigation/props';
import { requestAllPermissions } from '../utils/permissions';
import { ConfirmDeleteModal } from '../components/Base/ConfirmDeleteModal';

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

  const clearDraft = useCallback(() => {
    setImageUri(null);
    setLocation(null);
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

          if (!permissionSummary.cameraGranted || !permissionSummary.locationGranted) {
            setPermissionHint('Camera and location permissions are required to save a memory.');
            return;
          }

          if (!permissionSummary.notificationGranted) {
            setPermissionHint('Notifications are optional. You can still save memories.');
            return;
          }

          setPermissionHint('');
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

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant camera access to take a picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await fetchLocation(); 
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
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
      Alert.alert('Missing Info', 'Please capture an image and wait for location to load.');
      return;
    }

    try {
      setLoading(true);
      const entry = {
        id: Date.now().toString(),
        imageUri,
        location,
        timestamp: Date.now(),
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
      <View style={styles.content}>
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
            onPress={takePicture}
          >
            <Ionicons name="camera" size={48} color={colors.primary} />
            <Text style={[styles.cameraText, { color: colors.textSecondary }]}>Capture Memory</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={takePicture}>
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
      </View>

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
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  content: { flex: 1 },
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
  footerActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  }
});