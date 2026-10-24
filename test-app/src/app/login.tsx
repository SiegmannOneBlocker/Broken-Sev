import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BrandTitle,
  ErrorText,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { useAuth } from '../lib/AuthContext';
import { colors, spacing } from '../lib/theme';

export default function LoginScreen() {
  const { login, settings } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    setBusy(true);
    setError(null);
    const result = await login(employeeId, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Login failed.');
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <BrandTitle />
          <Title>Sign in</Title>
          <Subtitle>
            Enter your employee ID and password. Administrators may also sign in
            with their email.
          </Subtitle>

          <Field
            label="Employee ID / Email"
            value={employeeId}
            onChangeText={setEmployeeId}
            autoCorrect={false}
            placeholder="E12345 or you@company.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <ErrorText message={error} />
          <PrimaryButton
            label={busy ? 'Signing in…' : 'Sign in'}
            onPress={onLogin}
            disabled={busy}
          />

          <View style={styles.links}>
            <Link href="/create-account" style={styles.link}>
              Create an account
            </Link>
          </View>

          {!settings.initialized && (
            <View style={styles.setupBox}>
              <Text style={styles.setupTitle}>First-time setup</Text>
              <Text style={styles.setupBody}>
                No employer is configured yet. Create the creator / employer
                account with a specific email to receive admin confirmations.
              </Text>
              <PrimaryButton
                label="Set up employer account"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/create-account',
                    params: { mode: 'employer' },
                  })
                }
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  links: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 16,
  },
  setupBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  setupTitle: {
    color: colors.warn,
    fontWeight: '700',
    marginBottom: 6,
  },
  setupBody: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
