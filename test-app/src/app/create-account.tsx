import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ErrorText,
  Field,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { colors, spacing } from '../lib/theme';

export default function CreateAccountScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEmployerSetup = mode === 'employer';

  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [asAdministrator, setAsAdministrator] = useState(isEmployerSetup);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const needsEmail = useMemo(
    () => isEmployerSetup || asAdministrator,
    [isEmployerSetup, asAdministrator],
  );

  const onContinue = () => {
    setError(null);
    if (!name.trim() || !employeeId.trim()) {
      setError('Please enter your name and employee ID.');
      return;
    }
    if (needsEmail && !email.trim()) {
      setError('Administrator / employer setup requires a specific email.');
      return;
    }
    if (needsEmail && !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    router.push({
      pathname: '/create-password',
      params: {
        name: name.trim(),
        employeeId: employeeId.trim(),
        email: email.trim(),
        asAdministrator: asAdministrator || isEmployerSetup ? '1' : '0',
        asEmployer: isEmployerSetup ? '1' : '0',
      },
    });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Title>
            {isEmployerSetup ? 'Creator / Employer setup' : 'Create an account'}
          </Title>
          <Subtitle>
            {isEmployerSetup
              ? 'Set up the employer account with a specific email. Admin sign-ins with that email flow will notify you for acceptance.'
              : 'Enter your name and employee ID. Next you will choose a password.'}
          </Subtitle>

          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Alex Rivera"
          />
          <Field
            label="Employee ID"
            value={employeeId}
            onChangeText={setEmployeeId}
            placeholder="E12345"
          />

          {!isEmployerSetup && (
            <Pressable
              style={styles.checkRow}
              onPress={() => setAsAdministrator((v) => !v)}
            >
              <View
                style={[styles.checkbox, asAdministrator && styles.checkboxOn]}
              >
                {asAdministrator ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>Administrator option</Text>
                <Text style={styles.checkHint}>
                  Set up with a specific email. After you sign in with that
                  email, a confirmation is sent to the employer to accept.
                </Text>
              </View>
            </Pressable>
          )}

          {needsEmail && (
            <Field
              label={isEmployerSetup ? 'Employer email' : 'Administrator email'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@company.com"
              autoCapitalize="none"
            />
          )}

          <ErrorText message={error} />
          <PrimaryButton label="Continue to password" onPress={onContinue} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    color: colors.white,
    fontWeight: '800',
  },
  checkLabel: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  checkHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
