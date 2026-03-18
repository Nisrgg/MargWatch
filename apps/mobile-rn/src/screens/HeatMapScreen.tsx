import React, { useMemo } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { HeatmapMap } from '../components/map/HeatmapMap';
import { HeatmapStatsCard } from '../components/cards/HeatmapStatsCard';
import { useHeatMapData } from '../hooks/useComplaints';
import { computeRegion } from '../utils/map';

const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

type Props = NativeStackScreenProps<MainStackParamList, 'HeatMap'>;

export default function HeatMapScreen({ navigation }: Props) {
  const { data, isLoading, error } = useHeatMapData();

  const heatMapData = data?.heatMapData ?? [];
  const region = useMemo(() => {
    return computeRegion(
      heatMapData.map((d) => ({ latitude: d.latitude, longitude: d.longitude })),
      DEFAULT_REGION,
    );
  }, [heatMapData]);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Heat map"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#F97316', fontWeight: '600' }}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        }
      />
      <ScreenState loading={isLoading} error={error}>
        <ScreenBody>
          {region && <HeatmapMap points={heatMapData} region={region} />}
          <HeatmapStatsCard points={heatMapData} />
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
