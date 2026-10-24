import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function EmployeeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'test' }} />
    </Stack>
  );
}
