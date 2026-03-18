import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TouchableOpacity, Text } from 'react-native';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { ComplaintHeaderCard } from '../components/cards/ComplaintHeaderCard';
import { WorkOrderSummaryCard } from '../components/cards/WorkOrderSummaryCard';
import { ImageStrip } from '../components/media/ImageStrip';
import { SubSectionHeader } from '../components/layout/SubSectionHeader';
import { useComplaintDetail } from '../hooks/useComplaints';
import { parseComplaintImages } from '../utils/complaints';

type Props = NativeStackScreenProps<MainStackParamList, 'ComplaintDetail'>;

export default function ComplaintDetailScreen({ route, navigation }: Props) {
  const { complaintId } = route.params;
  const { data: complaint, isLoading, error } = useComplaintDetail(complaintId);

  const imageUrls = parseComplaintImages(
    (complaint?.imageUrl as string | undefined) ?? undefined,
  );

  return (
    <ScreenContainer>
      <SectionHeader
        title="Complaint detail"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#F97316', fontWeight: '600' }}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        }
      />
      <ScreenState loading={isLoading} error={error}>
        {complaint && (
          <ScreenBody>
            <ComplaintHeaderCard complaint={complaint} />
            <ImageStrip uris={imageUrls} />
            {complaint.workOrders && complaint.workOrders.length > 0 ? (
              <>
                <SubSectionHeader title="Work orders" />
                {complaint.workOrders.map((wo) => (
                  <WorkOrderSummaryCard key={wo.id} workOrder={wo} />
                ))}
              </>
            ) : null}
          </ScreenBody>
        )}
      </ScreenState>
    </ScreenContainer>
  );
}
