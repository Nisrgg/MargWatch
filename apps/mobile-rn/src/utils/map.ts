export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export function computeRegion(points: MapPoint[], fallback?: MapRegion): MapRegion | undefined {
  if (!points || points.length === 0) return fallback;

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLon + maxLon) / 2;

  const latitudeDelta = Math.max((maxLat - minLat) * 1.2, 0.2);
  const longitudeDelta = Math.max((maxLon - minLon) * 1.2, 0.2);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

