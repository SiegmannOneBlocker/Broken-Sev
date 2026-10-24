import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BrandTitle,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { colors, spacing } from '../lib/theme';

export default function PendingScreen() {
  const { user, logout, refresh } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const onRefresh = async () => {
    await refresh();
    router.replace('/');
  };

  const rejected = user?.status === 'rejected';
  const isAdmin = user?.role === 'administrator';

  return (
    <Screen style={styles.center}>
      <BrandTitle />
      <Title>{rejected ? 'Account rejected' : 'Waiting for approval'}</Title>
      <Subtitle>
        {rejected
          ? 'The employer declined this account. Contact your employer or create a new account.'
          : isAdmin
            ? `You signed in with ${user?.email ?? 'your administrator email'}. A confirmation was sent to the employer to accept this administrator account.`
            : 'Your account is pending employer acceptance. You can sign in again after approval.'}
      </Subtitle>

      <View style={styles.box}>
        <Text style={styles.meta}>Name: {user?.name}</Text>
        <Text style={styles.meta}>Employee ID: {user?.employeeId}</Text>
        {user?.email ? <Text style={styles.meta}>Email: {user.email}</Text> : null}
        <Text style={styles.meta}>Role: {user?.role}</Text>
        <Text style={styles.meta}>Status: {user?.status}</Text>
      </View>

      <PrimaryButton label="Check status" onPress={onRefresh} />
      <PrimaryButton label="Sign out" variant="secondary" onPress={onLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  meta: {
    color: colors.text,
    marginBottom: 6,
  },
});
