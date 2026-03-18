import React from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { useAuth } from '../hooks/useAuth';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { SectionHeader } from '../components/layout/SectionHeader';
import { ScreenBody } from '../components/layout/ScreenBody';
import { DashboardHeaderCard } from '../components/cards/DashboardHeaderCard';
import { QuickActionCard } from '../components/cards/QuickActionCard';
import { MWButton } from '../components/buttons/MWButton';
import { SectionSpacer } from '../components/layout/SectionSpacer';
import { ActionList } from '../components/lists/ActionList';
import { getDashboardMenu } from '../config/getDashboardMenu';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Main'>;
};

export default function MainScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const visibleItems = getDashboardMenu(user?.role);

  return (
    <ScreenContainer>
      <SectionHeader
        title="MargWatch Control Center"
        right={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#F97316', fontWeight: '600' }}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        }
      />
      <View
        style={{
          backgroundColor: '#FFF7ED',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 18,
          marginTop: 8,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#FED7AA',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 4,
          }}
        >
          Hello, Nisarg
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: '#6B7280',
          }}
        >
          Here&apos;s a snapshot of your road network. Jump into the areas that
          need your attention the most.
        </Text>
      </View>
      <DashboardHeaderCard user={user ?? null} />
      <SectionHeader title="What would you like to do today?" />
      <ScreenBody>
        <ActionList>
          {visibleItems.map((item) => (
            <QuickActionCard
              key={item.key}
              label={item.label}
              subtitle={item.subtitle}
              onPress={() => navigation.navigate(item.key as keyof MainStackParamList)}
            />
          ))}
        </ActionList>
        <SectionSpacer />
        <MWButton title="Sign out" variant="outline" onPress={logout} />
      </ScreenBody>
    </ScreenContainer>
  );
}
