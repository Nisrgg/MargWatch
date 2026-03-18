import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, View, RefreshControl } from 'react-native';
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
  const { data, isLoading, error, refetch } = useComplaintsList();
  const [refreshing, setRefreshing] = useState(false);
  const complaints = data?.complaints ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const renderListHeader = () => {
    if (complaints.length === 0) return null;

    return (
      <View
        style={{
          backgroundColor: '#FFF7ED',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#FED7AA',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#111827',
          }}
        >
          You have {complaints.length} active complaint
          {complaints.length > 1 ? 's' : ''}.
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: '#6B7280',
            marginTop: 4,
          }}
        >
          Tap any card to view photos, status, and updates.
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <SectionHeader
        title="My complaints"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#F97316', fontWeight: '600' }}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        }
      />
      {complaints.length > 0 && (
        <View
          style={{
            backgroundColor: '#FFF7ED',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginTop: 4,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: '#FED7AA',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#111827',
            }}
          >
            You have {complaints.length} active complaint
            {complaints.length > 1 ? 's' : ''}.
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#6B7280',
              marginTop: 2,
            }}
          >
            Tap any complaint card to see photos, status, and work orders.
          </Text>
        </View>
      )}
      <ScreenState
        loading={isLoading && !refreshing}
        error={error}
        empty={!isLoading && !complaints.length}
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
            ListHeaderComponent={renderListHeader}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
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
