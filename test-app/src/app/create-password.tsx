import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  ErrorText,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { spacing } from '../lib/theme';

export default function CreatePasswordScreen() {
  const params = useLocalSearchParams<{
    name: string;
    employeeId: string;
    email?: string;
    asAdministrator?: string;
    asEmployer?: string;
  }>();
  const { createAccount } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    const result = await createAccount({
      name: params.name ?? '',
      employeeId: params.employeeId ?? '',
      password,
      email: params.email || undefined,
      asAdministrator: params.asAdministrator === '1',
      asEmployer: params.asEmployer === '1',
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? 'Could not create account.');
      return;
    }

    router.replace('/');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Title>Choose a password</Title>
          <Subtitle>
            Hi {params.name || 'there'}. Set a password for employee ID{' '}
            {params.employeeId}.
          </Subtitle>

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Re-enter password"
          />

          <ErrorText message={error} />
          <PrimaryButton
            label={busy ? 'Creating…' : 'Create account'}
            onPress={onCreate}
            disabled={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
});
