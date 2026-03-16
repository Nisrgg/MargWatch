import React from 'react';
import { TextField } from './TextField';

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
}

export function PasswordField(props: PasswordFieldProps) {
  return (
    <TextField
      {...props}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
    />
  );
}

