import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/AuthContext';
import { TrackingProvider } from '../lib/TrackingContext';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <TrackingProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-account"
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen
            name="create-password"
            options={{ title: 'Set Password' }}
          />
          <Stack.Screen name="pending" options={{ headerShown: false }} />
          <Stack.Screen name="(employee)" options={{ headerShown: false }} />
          <Stack.Screen name="(employer)" options={{ headerShown: false }} />
        </Stack>
      </TrackingProvider>
    </AuthProvider>
  );
}
