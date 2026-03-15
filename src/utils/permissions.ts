import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export type PermissionStatusSummary = {
  cameraGranted: boolean;
  locationGranted: boolean;
  notificationGranted: boolean;
};

export const requestAllPermissions = async (): Promise<PermissionStatusSummary> => {
  const [cameraPermission, locationPermission, notificationPermission] = await Promise.all([
    ImagePicker.requestCameraPermissionsAsync(),
    Location.requestForegroundPermissionsAsync(),
    Notifications.requestPermissionsAsync(),
  ]);

  return {
    cameraGranted: cameraPermission.status === 'granted',
    locationGranted: locationPermission.status === 'granted',
    notificationGranted: notificationPermission.status === 'granted',
  };
};
