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

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Main'>;
};

export default function MainScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const visibleItems = getDashboardMenu(user?.role);

  return (
    <ScreenContainer>
      <DashboardHeaderCard user={user ?? null} />
      <SectionHeader title="Quick actions" />
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
