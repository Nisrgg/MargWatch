/**
 * Geolocation utilities - get current position and validate coordinates.
 * Uses react-native-geolocation-service for coordinates.
 * Reverse geocoding (address from lat/lon) is done by the backend on submit.
 */
import Geolocation from 'react-native-geolocation-service';

export interface Position {
  latitude: number;
  longitude: number;
}

export const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 37.5,
  minLon: 68.0,
  maxLon: 97.5,
};

export function validateCoordinates(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  return true;
}

export function isWithinIndiaBounds(lat: number, lon: number): boolean {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

/**
 * Get current position. Request high accuracy for complaint submission.
 */
export function getCurrentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
}
