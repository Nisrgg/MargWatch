import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { MWList } from '../components/lists/MWList';
import { ComplaintCard } from '../components/ComplaintCard';
import { useComplaintsList } from '../hooks/useComplaints';
import { EmptyState } from '../components/feedback/EmptyState';

type Props = NativeStackScreenProps<MainStackParamList, 'ComplaintsList'>;

export default function ComplaintsListScreen({ navigation }: Props) {
  const { data, isLoading, error } = useComplaintsList();
  const complaints = data?.complaints ?? [];

  return (
    <ScreenContainer>
      <SectionHeader title="My complaints" />
      <ScreenState
        loading={isLoading}
        error={error}
        empty={!complaints.length}
        emptyComponent={
          <EmptyState
            title="No complaints yet."
            message="Submit one from the main screen."
          />
        }
      >
        <ScreenBody>
          <MWList
            data={complaints}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ComplaintCard
                complaint={item}
                onPress={() =>
                  navigation.navigate('ComplaintDetail', { complaintId: item.id })
                }
              />
            )}
          />
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
