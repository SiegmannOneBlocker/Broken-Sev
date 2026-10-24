import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen, Subtitle, Title } from '../../components/ui';
import { useTracking } from '../../lib/TrackingContext';
import type { ReportType } from '../../lib/types';
import { colors, spacing } from '../../lib/theme';

const FILTERS: Array<ReportType | 'all'> = [
  'all',
  'daily',
  'incident',
  'suggestion',
  'request',
  'activity',
];

export default function ReportsScreen() {
  const { reports } = useTracking();
  const [filter, setFilter] = useState<ReportType | 'all'>('all');

  const filtered = useMemo(
    () =>
      filter === 'all' ? reports : reports.filter((r) => r.type === filter),
    [reports, filter],
  );

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Title>All reports</Title>
        <Subtitle>
          Daily, incident, suggestion, request, and activity reports submitted
          by employees during shifts.
        </Subtitle>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipOn]}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>No reports yet.</Text>
        ) : (
          filtered.map((r) => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.type}>{r.type}</Text>
              <Text style={styles.meta}>
                {r.employeeName} · {r.employeeId}
              </Text>
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
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.bgElevated,
  },
  chipOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  chipTextOn: {
    color: colors.white,
  },
  empty: { color: colors.textMuted },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  type: {
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4,
  },
  body: {
    color: colors.text,
    marginTop: 10,
    lineHeight: 20,
  },
});
