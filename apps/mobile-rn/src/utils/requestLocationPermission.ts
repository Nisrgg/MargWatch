/**
 * Request location permission on Android (required for getCurrentPosition).
 * iOS: react-native-geolocation-service uses info.plist NSLocationWhenInUseUsageDescription.
 */
import { Platform, PermissionsAndroid } from 'react-native';

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'MargWatch needs your location to attach coordinates to complaints.',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}
