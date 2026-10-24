import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ReportModal } from '../../components/ReportModal';
import {
  Card,
  ErrorText,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../components/ui';
import { useAuth } from '../../lib/AuthContext';
import { useTracking } from '../../lib/TrackingContext';
import type { ReportType } from '../../lib/types';
import { colors, spacing } from '../../lib/theme';

const REPORTS: { type: ReportType; label: string; hint: string }[] = [
  { type: 'daily', label: 'Daily Reports', hint: 'Summarize today’s work' },
  { type: 'incident', label: 'Incident Reports', hint: 'Report an incident' },
  {
    type: 'suggestion',
    label: 'Employee Suggestions',
    hint: 'Share an improvement idea',
  },
  { type: 'request', label: 'Employee Requests', hint: 'Ask for support or supplies' },
  { type: 'activity', label: 'Activity Reports', hint: 'Log completed activities' },
];

export default function EmployeeHome() {
  const { user, logout } = useAuth();
  const { activeShift, startShift, endShift, submitReport } = useTracking();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportType, setReportType] = useState<ReportType | null>(null);

  const onStart = async () => {
    setBusy(true);
    setError(null);
    const result = await startShift();
    setBusy(false);
    if (!result.ok) setError(result.error ?? 'Could not start shift.');
  };

  const onEnd = () => {
    Alert.alert('End shift?', 'Tracking will stop for this shift.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End shift',
        style: 'destructive',
        onPress: async () => {
          await endShift();
        },
      },
    ]);
  };

  const onLogout = async () => {
    if (activeShift) {
      Alert.alert('Active shift', 'End your shift before signing out.');
      return;
    }
    await logout();
    router.replace('/login');
  };

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Title>Hi, {user?.name}</Title>
        <Subtitle>
          Employee ID {user?.employeeId}. Location tracking is recorded for your
          employer only — you will not see travel, dwell, or elevation details
          here.
        </Subtitle>

        <Card>
          {!activeShift ? (
            <>
              <Text style={styles.cardTitle}>Shift</Text>
              <Text style={styles.cardBody}>
                Select Start Shift to begin. The app records the start time and
                location for your employer.
              </Text>
              <ErrorText message={error} />
              <PrimaryButton
                label={busy ? 'Starting…' : 'Start Shift'}
                onPress={onStart}
                disabled={busy}
              />
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Shift in progress</Text>
              <Text style={styles.cardBody}>
                Started:{' '}
                {new Date(activeShift.startedAt).toLocaleString()}
              </Text>
              <Text style={styles.cardBody}>
                Start time and location have been recorded for your employer.
                Tracking details are not shown on this screen.
              </Text>
              <PrimaryButton label="End Shift" variant="danger" onPress={onEnd} />
            </>
          )}
        </Card>

        {activeShift ? (
          <>
            <Text style={styles.section}>During your shift</Text>
            {REPORTS.map((item) => (
              <Pressable
                key={item.type}
                style={styles.reportBtn}
                onPress={() => setReportType(item.type)}
              >
                <Text style={styles.reportLabel}>{item.label}</Text>
                <Text style={styles.reportHint}>{item.hint}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>
            Start a shift to unlock daily reports, incidents, suggestions,
            requests, and activity reports.
          </Text>
        )}

        <PrimaryButton label="Sign out" variant="ghost" onPress={onLogout} />
      </ScrollView>

      <ReportModal
        type={reportType}
        visible={reportType != null}
        onClose={() => setReportType(null)}
        onSubmit={async (body) => {
          if (!reportType) return { ok: false, error: 'No report type.' };
          return submitReport(reportType, body);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 6,
  },
  cardBody: {
    color: colors.textMuted,
    marginBottom: 8,
    lineHeight: 20,
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  reportBtn: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  reportHint: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
