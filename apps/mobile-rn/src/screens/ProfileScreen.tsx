import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { ProfileHeader } from '../components/cards/ProfileHeader';
import { TextField } from '../components/forms/TextField';
import { MWButton } from '../components/buttons/MWButton';
import { FormSection } from '../components/forms/FormSection';
import { useAuth } from '../hooks/useAuth';
import { useProfileForm } from '../hooks/useProfileForm';
import { useSnackbar } from '../components/feedback/SnackbarProvider';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { fields, setters, loading, submit } = useProfileForm({ user: user ?? undefined });
  const { showSuccess, showError } = useSnackbar();

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result.ok) {
      showSuccess('Profile updated.');
    } else {
      const message =
        result.error instanceof Error ? result.error.message : 'Update failed.';
      showError(message);
    }
  }, [submit, showSuccess, showError]);

  return (
    <ScreenContainer>
      <SectionHeader title="Profile" />
      <ScreenState loading={loading}>
        <ScreenBody>
          <ProfileHeader user={user ?? null} />
          <FormSection title="Personal information">
            <TextField
              label="First name"
              value={fields.firstName}
              onChangeText={setters.setFirstName}
              placeholder="First name"
            />
            <TextField
              label="Last name"
              value={fields.lastName}
              onChangeText={setters.setLastName}
              placeholder="Last name"
            />
            <TextField
              label="Phone"
              value={fields.phone}
              onChangeText={setters.setPhone}
              placeholder="Phone"
              keyboardType="numeric"
            />
            <MWButton
              title={loading ? 'Saving…' : 'Save profile'}
              onPress={handleSave}
              loading={loading}
            />
          </FormSection>
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
