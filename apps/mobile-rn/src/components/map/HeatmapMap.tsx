import React from 'react';
import MapView, { Marker, Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  category?: string;
  count?: number;
}

interface HeatmapMapProps {
  points: HeatmapPoint[];
  region: Region;
}

export function HeatmapMap({ points, region }: HeatmapMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton
    >
      {points.map((point, index) => (
        <Marker
          key={`${point.latitude}-${point.longitude}-${index}`}
          coordinate={{ latitude: point.latitude, longitude: point.longitude }}
          title={point.category}
          description={point.count != null ? `Count: ${point.count}` : undefined}
          pinColor={colors.primary}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
});

