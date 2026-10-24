import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen, Subtitle, Title } from '../../../components/ui';
import { useAuth } from '../../../lib/AuthContext';
import {
  formatDistance,
  formatDuration,
  formatElevation,
} from '../../../lib/geo';
import { useTracking } from '../../../lib/TrackingContext';
import { colors, spacing } from '../../../lib/theme';

export default function EmployeeTrackingScreen() {
  const { employeeId } = useLocalSearchParams<{ employeeId: string }>();
  const { users } = useAuth();
  const { shiftsForEmployee, reportsForEmployee } = useTracking();

  const employee = users.find((u) => u.employeeId === employeeId);
  const shifts = useMemo(
    () => shiftsForEmployee(employeeId ?? ''),
    [shiftsForEmployee, employeeId],
  );
  const reports = useMemo(
    () => reportsForEmployee(employeeId ?? ''),
    [reportsForEmployee, employeeId],
  );

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Title>{employee?.name ?? employeeId}</Title>
        <Subtitle>
          Employer-only tracking: location traveled, time spent in one spot, and
          elevation. Employees cannot see this screen.
        </Subtitle>

        {shifts.length === 0 ? (
          <Text style={styles.empty}>No shifts recorded yet.</Text>
        ) : (
          shifts.map((shift) => {
            const alts = shift.path
              .map((p) => p.altitude)
              .filter((a): a is number => a != null && !Number.isNaN(a));
            const minAlt = alts.length ? Math.min(...alts) : null;
            const maxAlt = alts.length ? Math.max(...alts) : null;
            const latest = shift.path[shift.path.length - 1];

            return (
              <View key={shift.id} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.shiftTitle}>
                    {shift.active ? 'Active shift' : 'Completed shift'}
                  </Text>
                  {shift.active ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>LIVE</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.meta}>
                  Started: {new Date(shift.startedAt).toLocaleString()}
                </Text>
                {shift.endedAt ? (
                  <Text style={styles.meta}>
                    Ended: {new Date(shift.endedAt).toLocaleString()}
                  </Text>
                ) : null}

                {shift.startLocation ? (
                  <Text style={styles.meta}>
                    Start location: {shift.startLocation.latitude.toFixed(5)},{' '}
                    {shift.startLocation.longitude.toFixed(5)} · elev{' '}
                    {formatElevation(shift.startLocation.altitude)}
                  </Text>
                ) : null}

                <Text style={styles.metric}>
                  Distance traveled: {formatDistance(shift.totalDistanceMeters)}
                </Text>
                <Text style={styles.metric}>
                  Path points: {shift.path.length}
                </Text>
                <Text style={styles.metric}>
                  Current / last elevation:{' '}
                  {formatElevation(latest?.altitude ?? null)}
                </Text>
                <Text style={styles.metric}>
                  Elevation range: {formatElevation(minAlt)} –{' '}
                  {formatElevation(maxAlt)}
                </Text>

                <Text style={styles.section}>Time spent in one spot</Text>
                {shift.dwells.length === 0 ? (
                  <Text style={styles.meta}>No dwell segments yet.</Text>
                ) : (
                  shift.dwells.map((d, i) => (
                    <View key={`${shift.id}-dwell-${i}`} style={styles.dwell}>
                      <Text style={styles.meta}>
                        Spot {i + 1}: {d.latitude.toFixed(5)},{' '}
                        {d.longitude.toFixed(5)}
                      </Text>
                      <Text style={styles.meta}>
                        Elev {formatElevation(d.altitude)} ·{' '}
                        {formatDuration(
                          d.endedAt
                            ? d.durationMs
                            : Date.now() - new Date(d.startedAt).getTime(),
                        )}
                        {d.endedAt ? '' : ' (ongoing)'}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          })
        )}

        <Text style={styles.section}>Employee reports</Text>
        {reports.length === 0 ? (
          <Text style={styles.empty}>No reports from this employee.</Text>
        ) : (
          reports.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.shiftTitle}>{r.type}</Text>
              <Text style={styles.meta}>
                {new Date(r.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.body}>{r.body}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  badge: {
    backgroundColor: colors.accentDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
  },
  meta: {
    color: colors.textMuted,
    marginBottom: 4,
    lineHeight: 18,
  },
  metric: {
    color: colors.text,
    fontWeight: '600',
    marginTop: 6,
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 8,
    fontSize: 15,
  },
  dwell: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  body: {
    color: colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
});
