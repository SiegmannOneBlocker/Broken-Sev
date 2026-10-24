import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../components/ui';
import { useAuth } from '../../lib/AuthContext';
import { colors, spacing } from '../../lib/theme';

export default function ApprovalsScreen() {
  const { user, pendingApprovals, approveUser, rejectUser, settings } =
    useAuth();

  if (user?.role !== 'employer') {
    return (
      <Screen style={{ paddingTop: spacing.md }}>
        <Title>Employer only</Title>
        <Subtitle>
          Only the employer account can accept administrator and employee
          confirmations.
        </Subtitle>
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView>
        <Title>Employer confirmations</Title>
        <Subtitle>
          Confirmations for new employees and administrator accounts are sent
          here{settings.employerEmail ? ` (${settings.employerEmail})` : ''}.
          Accept or reject each request.
        </Subtitle>

        {pendingApprovals.length === 0 ? (
          <Text style={styles.empty}>No pending confirmations.</Text>
        ) : (
          pendingApprovals.map((u) => (
            <View key={u.id} style={styles.card}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.meta}>Employee ID: {u.employeeId}</Text>
              {u.email ? <Text style={styles.meta}>Email: {u.email}</Text> : null}
              <Text style={styles.meta}>Role: {u.role}</Text>
              {u.role === 'administrator' ? (
                <Text style={styles.note}>
                  Administrator signed in with their email — confirmation
                  requested for your acceptance.
                </Text>
              ) : (
                <Text style={styles.note}>
                  New employee account awaiting approval.
                </Text>
              )}
              <View style={styles.actions}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Accept"
                    onPress={() => approveUser(u.id)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Reject"
                    variant="danger"
                    onPress={() => rejectUser(u.id)}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
  },
  note: {
    color: colors.warn,
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
});
