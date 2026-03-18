import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <LinearGradient colors={['#FFF7ED', '#FFE0B2', '#FFFFFF']} style={styles.background}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF7ED" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.headerTop}>
            <Text style={styles.appTitle}>WELCOME TO MARGWATCH</Text>
            <Text style={styles.appSubtitle}>Smart road issue reporting</Text>
          </View>
          <View style={styles.centerContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardSubtitle}>Continue to manage complaints and work orders.</Text>

              <View style={styles.form}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                />
                <View style={styles.fieldSpacing} />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                />
              </View>

              <View style={styles.primaryAction}>
                <Button title="Login" onPress={handleLogin} />
              </View>

              <View style={styles.secondaryAction}>
                <Text style={styles.secondaryText}>New to MargWatch?</Text>
                <Button title="Create an account" onPress={() => navigation.navigate('Register')} />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© {new Date().getFullYear()} MargWatch</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: undefined,
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 6,
    marginBottom: 18,
  },
  form: {
    marginBottom: 16,
  },
  fieldSpacing: {
    height: 12,
  },
  primaryAction: {
    marginTop: 8,
  },
  secondaryAction: {
    marginTop: 20,
    gap: 8,
  },
  secondaryText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#BBBBBB',
  },
});
