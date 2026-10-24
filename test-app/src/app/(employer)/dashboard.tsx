import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../components/ui';
import { useAuth } from '../../lib/AuthContext';
import { formatDistance } from '../../lib/geo';
import { useTracking } from '../../lib/TrackingContext';
import { colors, spacing } from '../../lib/theme';

export default function EmployerDashboard() {
  const { user, users, pendingApprovals, logout } = useAuth();
  const { shifts, reports } = useTracking();

  const employees = useMemo(
    () => users.filter((u) => u.role === 'employee' && u.status === 'approved'),
    [users],
  );

  const activeShifts = useMemo(() => shifts.filter((s) => s.active), [shifts]);

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Title>test — Employer</Title>
        <Subtitle>
          Signed in as {user?.name} ({user?.role}). Tracking (distance, dwell
          time, elevation) is visible only here — not to employees.
        </Subtitle>

        <View style={styles.row}>
          <Pressable
            style={styles.stat}
            onPress={() => {
              if (user?.role === 'employer') {
                router.push('/(employer)/approvals');
              }
            }}
          >
            <Text style={styles.statNum}>{pendingApprovals.length}</Text>
            <Text style={styles.statLabel}>Pending approvals</Text>
          </Pressable>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{activeShifts.length}</Text>
            <Text style={styles.statLabel}>Active shifts</Text>
          </View>
          <Pressable
            style={styles.stat}
            onPress={() => router.push('/(employer)/reports')}
          >
            <Text style={styles.statNum}>{reports.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </Pressable>
        </View>

        {user?.role === 'employer' && pendingApprovals.length > 0 && (
          <Card>
            <Text style={styles.section}>Confirmations waiting</Text>
            <Text style={styles.body}>
              New accounts (including administrator email sign-ins) need your
              acceptance.
            </Text>
            <PrimaryButton
              label="Review approvals"
              onPress={() => router.push('/(employer)/approvals')}
            />
          </Card>
        )}

        <Text style={styles.section}>Employees</Text>
        {employees.length === 0 ? (
          <Text style={styles.body}>No approved employees yet.</Text>
        ) : (
          employees.map((emp) => {
            const active = shifts.find(
              (s) => s.active && s.employeeId === emp.employeeId,
            );
            const last = shifts.find((s) => s.employeeId === emp.employeeId);
            return (
              <Pressable
                key={emp.id}
                style={styles.empCard}
                onPress={() =>
                  router.push({
                    pathname: '/(employer)/employee/[employeeId]',
                    params: { employeeId: emp.employeeId },
                  })
                }
              >
                <Text style={styles.empName}>{emp.name}</Text>
                <Text style={styles.body}>ID {emp.employeeId}</Text>
                {active ? (
                  <Text style={styles.active}>
                    On shift · {formatDistance(active.totalDistanceMeters)} traveled
                  </Text>
                ) : last ? (
                  <Text style={styles.body}>
                    Last shift {new Date(last.startedAt).toLocaleString()}
                  </Text>
                ) : (
                  <Text style={styles.body}>No shifts yet</Text>
                )}
              </Pressable>
            );
          })
        )}

        <PrimaryButton
          label="All reports"
          variant="secondary"
          onPress={() => router.push('/(employer)/reports')}
        />
        <PrimaryButton label="Sign out" variant="ghost" onPress={onLogout} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statNum: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 8,
  },
  body: {
    color: colors.textMuted,
    marginBottom: 6,
    lineHeight: 20,
  },
  empCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  empName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  active: {
    color: colors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
});
