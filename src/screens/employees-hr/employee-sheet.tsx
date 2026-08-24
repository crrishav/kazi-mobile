import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import { BANKS, DEPTS } from '@/data/employees-hr/mock';
import { acctDigits, acctHint, acctValid } from '@/data/employees-hr/utils';
import type { EmployeeDraft, SheetMode } from '@/data/employees-hr/types';

export interface EmployeeSheetProps {
  visible: boolean;
  mode: SheetMode;
  draft: EmployeeDraft;
  onChange: (patch: Partial<EmployeeDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  sheetMeta: string;
  saveHint: string;
  saveCode: string;
  onViewSlip: () => void;
}

export function EmployeeSheet({ visible, mode, draft, onChange, onClose, onSave, sheetMeta, saveHint, saveCode, onViewSlip }: EmployeeSheetProps) {
  const theme = useTheme();
  const digits = acctDigits(draft.acct);
  const ok = acctValid(draft.acct);
  const canSave = draft.name.trim().length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={mode === 'edit' ? 'Edit employee' : 'Add employee'}>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
        {sheetMeta}
      </Text>

      <TextField label="Full name" value={draft.name} onChangeText={(v) => onChange({ name: v })} placeholder="e.g. Sanjita Rai" autoCapitalize="words" />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Role</Text>
        <TextInput
          value={draft.role}
          onChangeText={(v) => onChange({ role: v })}
          placeholder="e.g. Sewing operator"
          placeholderTextColor={theme.textSecondary}
          style={[styles.roleInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DEPTS.map((d) => {
            const on = draft.dept === d;
            return (
              <Pressable
                key={d}
                onPress={() => onChange({ dept: d })}
                style={[styles.deptChip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.deptLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{d}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.bankCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={styles.bankHeader}>
          <Text style={[styles.bankHeaderLabel, { color: theme.textSecondary }]}>Bank account · salary transfer</Text>
          <Icon name="credit-card" size={15} color={theme.textSecondary} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {BANKS.map((b) => {
            const on = draft.bank === b;
            return (
              <Pressable
                key={b}
                onPress={() => onChange({ bank: b })}
                style={[styles.bankChip, { backgroundColor: on ? theme.accentWash : theme.surfaceRaised, borderColor: on ? theme.accent : theme.border }]}
              >
                <Text style={[styles.bankLabel, { color: on ? theme.accentWashText : theme.textPrimary }]}>{b}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.group}>
          <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Account number</Text>
          <TextInput
            value={draft.acct}
            onChangeText={(v) => onChange({ acct: v })}
            placeholder="13 digits"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
            style={[styles.acctInput, { borderColor: digits.length === 0 || ok ? theme.border : theme.danger, backgroundColor: theme.surfaceRaised, color: theme.textPrimary }]}
          />
          <Text style={[styles.acctHint, { color: digits.length === 0 || ok ? theme.textSecondary : theme.dangerText }]}>{acctHint(draft.acct)}</Text>
        </View>

        <View style={styles.rowGroup}>
          <View style={[styles.group, styles.flex1]}>
            <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Branch</Text>
            <TextInput
              value={draft.branch}
              onChangeText={(v) => onChange({ branch: v })}
              placeholder="Balaju"
              placeholderTextColor={theme.textSecondary}
              style={[styles.smallInput, { backgroundColor: theme.surfaceRaised, borderColor: theme.border, color: theme.textPrimary }]}
            />
          </View>
          <View style={[styles.group, styles.flex1]}>
            <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Monthly basic</Text>
            <TextInput
              value={draft.basic}
              onChangeText={(v) => onChange({ basic: v })}
              placeholder="18,600"
              keyboardType="numeric"
              placeholderTextColor={theme.textSecondary}
              style={[styles.smallInput, tabularNums, { backgroundColor: theme.surfaceRaised, borderColor: theme.border, color: theme.textPrimary, fontFamily: fontFamily.mono }]}
            />
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ active: !draft.active })}
        style={[styles.statusButton, { backgroundColor: theme.surface, borderColor: draft.active ? theme.border : theme.danger }]}
      >
        <View style={styles.statusTextWrap}>
          <Text style={[styles.statusTitle, { color: theme.textPrimary }]}>{draft.active ? 'Active · on payroll' : 'Inactive · excluded from runs'}</Text>
          <Text style={[styles.statusHint, { color: theme.textSecondary }]}>
            {draft.active ? 'Appears in the open August run' : 'Records and past slips stay accessible'}
          </Text>
        </View>
        <Switch value={draft.active} onValueChange={() => onChange({ active: !draft.active })} />
      </Pressable>

      {mode === 'edit' ? (
        <Pressable onPress={onViewSlip} style={[styles.slipButton, { borderColor: theme.border }]}>
          <Text style={[styles.slipLabel, { color: theme.textPrimary }]}>View latest salary slip</Text>
        </Pressable>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={1}>
            {saveHint}
          </Text>
          <Text style={[styles.summaryCode, tabularNums, { color: theme.textSecondary }]}>{saveCode}</Text>
        </View>
        <Pressable onPress={onSave} disabled={!canSave} style={[styles.saveButton, { backgroundColor: canSave ? theme.accent : theme.draftWash }]}>
          <Text style={[styles.saveLabel, { color: canSave ? theme.accentText : theme.draftWashText }]}>{mode === 'edit' ? 'Save changes' : 'Add employee'}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase', marginTop: -12 },
  group: { gap: 8 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  smallLabel: { fontSize: 12.5 },
  roleInput: { height: 52, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, fontSize: 15 },
  chipRow: { gap: 7, paddingTop: 2 },
  deptChip: { height: 32, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deptLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },

  bankCard: { borderRadius: radii.lg, padding: 15, gap: 14 },
  bankHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bankHeaderLabel: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  bankChip: { height: 40, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bankLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  acctInput: { height: 48, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, fontFamily: fontFamily.mono, fontSize: 15, letterSpacing: 0.06 * 15 },
  acctHint: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  rowGroup: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  smallInput: { height: 48, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, fontSize: 14.5 },

  statusButton: { height: 66, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  statusTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  statusTitle: { fontSize: 14.5, fontWeight: '600' },
  statusHint: { fontFamily: fontFamily.mono, fontSize: 10.5, lineHeight: 10.5 * 1.4 },

  slipButton: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slipLabel: { fontSize: 14, fontWeight: '600' },

  footer: { gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryText: { flex: 1, fontSize: 13 },
  summaryCode: { fontSize: 11, flexShrink: 0 },
  saveButton: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 16, fontWeight: '600' },
});
