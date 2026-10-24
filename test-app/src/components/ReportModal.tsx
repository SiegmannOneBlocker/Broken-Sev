import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { ReportType } from '../lib/types';
import { colors, spacing } from '../lib/theme';
import { ErrorText, PrimaryButton } from './ui';

const LABELS: Record<ReportType, string> = {
  daily: 'Daily Report',
  incident: 'Incident Report',
  suggestion: 'Employee Suggestion',
  request: 'Employee Request',
  activity: 'Activity Report',
};

export function ReportModal({
  type,
  visible,
  onClose,
  onSubmit,
}: {
  type: ReportType | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (body: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!type) return null;

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    const result = await onSubmit(body);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not save.');
      return;
    }
    setBody('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{LABELS[type]}</Text>
          <Text style={styles.hint}>Enter details below. This is saved with your shift.</Text>
          <TextInput
            style={styles.box}
            multiline
            placeholder="Type your report here…"
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />
          <ErrorText message={error} />
          <PrimaryButton
            label={saving ? 'Saving…' : 'Submit'}
            onPress={handleSubmit}
            disabled={saving}
          />
          <PrimaryButton label="Cancel" variant="ghost" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  hint: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  box: {
    minHeight: 140,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
});
