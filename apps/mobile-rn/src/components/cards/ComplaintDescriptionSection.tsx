import React from 'react';
import { FormSection } from '../forms/FormSection';
import { TextField } from '../forms/TextField';

interface ComplaintDescriptionSectionProps {
  description: string;
  onChangeDescription: (value: string) => void;
}

export function ComplaintDescriptionSection({
  description,
  onChangeDescription,
}: ComplaintDescriptionSectionProps) {
  return (
    <FormSection title="Description (optional)">
      <TextField
        label="Description"
        value={description}
        onChangeText={onChangeDescription}
        placeholder="Describe the issue (optional)"
        multiline
      />
    </FormSection>
  );
}

