import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    try {
      await register(email, password, firstName, lastName);
    } catch (e) {
      Alert.alert('Registration failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Screen</Text>
      <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <Input label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <Input label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FEF7FF' },
  title: { fontSize: 24, marginBottom: 20, color: '#1C1B1F' },
});
