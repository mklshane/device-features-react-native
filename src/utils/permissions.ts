import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type PermissionStatusSummary = {
  cameraGranted: boolean;
  mediaLibraryGranted: boolean;
  locationGranted: boolean;
  notificationGranted: boolean;
  pushToken?: string;
};

export const requestAllPermissions = async (): Promise<PermissionStatusSummary> => {
  const [cameraPermission, mediaLibraryPermission, locationPermission, notificationPermission] = await Promise.all([
    ImagePicker.getCameraPermissionsAsync(),
    ImagePicker.getMediaLibraryPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);

  return {
    cameraGranted: cameraPermission.status === 'granted',
    mediaLibraryGranted: mediaLibraryPermission.status === 'granted',
    locationGranted: locationPermission.status === 'granted',
    notificationGranted: notificationPermission.status === 'granted',
  };
};

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const { granted: existingPermission } = await Notifications.getPermissionsAsync();
  let finalPermission = existingPermission;

  if (!existingPermission) {
    const { granted: requestedPermission } = await Notifications.requestPermissionsAsync();
    finalPermission = requestedPermission;
  }

  if (!finalPermission) {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
};
