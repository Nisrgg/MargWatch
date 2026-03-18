import React, { useState, useCallback } from 'react';
import { Alert, Platform, TouchableOpacity, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { MainStackParamList } from '../navigation/MainNavigator';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { ScreenState } from '../components/feedback/ScreenState';
import { FormActions } from '../components/forms/FormActions';
import { MWButton } from '../components/buttons/MWButton';
import { LocationPreviewCard } from '../components/cards/LocationPreviewCard';
import { ComplaintDescriptionSection } from '../components/cards/ComplaintDescriptionSection';
import { SubmissionSummaryCard } from '../components/cards/SubmissionSummaryCard';
import { ImageCaptureSection } from '../components/media/ImageCaptureSection';
import { useSubmitComplaint } from '../hooks/useSubmitComplaint';
import { compressImage, DEFAULT_MAX_WIDTH, DEFAULT_MAX_HEIGHT } from '../utils/compressImage';
import { getCurrentPosition, validateCoordinates } from '../utils/geolocation';
import { requestLocationPermission } from '../utils/requestLocationPermission';

const MAX_IMAGES = 5;

type Props = NativeStackScreenProps<MainStackParamList, 'ComplaintSubmission'>;

export default function ComplaintSubmissionScreen({ navigation }: Props) {
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLabel, setAddressLabel] = useState<string>(
    'E-4, Arera Colony, Bhopal, Madhya Pradesh 462016',
  );
  const [description, setDescription] = useState('');

  const submitMutation = useSubmitComplaint();

  const pickImages = useCallback((result: ImagePickerResponse) => {
    if (result.didCancel || !result.assets) return;
    const newUris = result.assets
      .slice(0, MAX_IMAGES - imageUris.length)
      .map((a) => a.uri)
      .filter((u): u is string => !!u);
    setImageUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
  }, [imageUris.length]);

  const openCamera = useCallback(() => {
    launchCamera({ mediaType: 'photo', quality: 1 }, pickImages);
  }, [pickImages]);

  const openGallery = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: MAX_IMAGES - imageUris.length }, pickImages);
  }, [imageUris.length, pickImages]);

  const removeImage = useCallback((index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const ok = await requestLocationPermission();
      if (!ok) {
        Alert.alert('Permission needed', 'Location permission is required to submit a complaint.');
        return;
      }
      const pos = await getCurrentPosition();
      setLatitude(pos.latitude);
      setLongitude(pos.longitude);
      setAddressLabel(`${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`);
    } catch (e) {
      Alert.alert('Location error', e instanceof Error ? e.message : 'Could not get location.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (imageUris.length === 0) {
      Alert.alert('Add photos', 'Please add at least one photo.');
      return;
    }
    if (latitude === null || longitude === null || !validateCoordinates(latitude, longitude)) {
      Alert.alert('Location required', 'Please get your current location before submitting.');
      return;
    }

    try {
      const compressedUris: string[] = [];
      for (const uri of imageUris) {
        const compressed = await compressImage(uri, {
          quality: 80,
          maxWidth: DEFAULT_MAX_WIDTH,
          maxHeight: DEFAULT_MAX_HEIGHT,
        });
        compressedUris.push(compressed);
      }

      const formData = new FormData();
      compressedUris.forEach((uri, i) => {
        formData.append('images', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: `image_${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      if (addressLabel) formData.append('address', addressLabel);

      await submitMutation.mutateAsync(formData);
      Alert.alert('Success', 'Complaint submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Submission failed', e instanceof Error ? e.message : 'Please try again.');
    }
  }, [imageUris, latitude, longitude, addressLabel, submitMutation, navigation]);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Submit complaint"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#F97316', fontWeight: '600' }}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        }
      />
      <ScreenState loading={submitMutation.isPending}>
        <ScreenBody>
          <ImageCaptureSection
            imageUris={imageUris}
            maxImages={MAX_IMAGES}
            onOpenCamera={openCamera}
            onOpenGallery={openGallery}
            onRemoveImage={removeImage}
          />

          <LocationPreviewCard
            latitude={latitude}
            longitude={longitude}
            address={addressLabel}
          />

          <ComplaintDescriptionSection
            description={description}
            onChangeDescription={setDescription}
          />

          <SubmissionSummaryCard
            imageCount={imageUris.length}
            hasLocation={latitude != null && longitude != null}
            hasDescription={!!description.trim()}
            addressLabel={addressLabel}
          />

          <FormActions>
            <MWButton
              title={
                locationLoading
                  ? 'Getting location…'
                  : latitude != null
                  ? 'Update location'
                  : 'Get current location'
              }
              onPress={getLocation}
              loading={locationLoading}
            />
            <View style={{ height: 12 }} />
            <MWButton
              title={submitMutation.isPending ? 'Submitting…' : 'Submit complaint'}
              onPress={handleSubmit}
              loading={submitMutation.isPending}
            />
          </FormActions>
        </ScreenBody>
      </ScreenState>
    </ScreenContainer>
  );
}
