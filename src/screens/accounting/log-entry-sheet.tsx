import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import { PICKS } from '@/data/accounting/mock';
import { fmt, getAccountCode, getAccountLabel, money } from '@/data/accounting/utils';
import type { BankDirection, EntryDraft, EntryMode } from '@/data/accounting/types';

export interface LogEntrySheetProps {
  visible: boolean;
  mode: EntryMode;
  onModeChange: (m: EntryMode) => void;
  draft: EntryDraft;
  onChange: (patch: Partial<EntryDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  addRef: string;
}

export function LogEntrySheet({ visible, mode, onModeChange, draft, onChange, onClose, onSave, addRef }: LogEntrySheetProps) {
  const theme = useTheme();

  const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10) || 0;
  const sameAccount = draft.debitAcct === draft.creditAcct;
  const ready = amount > 0 && !sameAccount;

  const debitLabel = mode === 'journal' ? 'Debit account' : 'Charge to account';
  const creditLabel = mode === 'journal' ? 'Credit account' : 'Paid from';
  const memoPlaceholder = mode === 'journal' ? 'e.g. Monthly depreciation · machinery' : 'e.g. Diesel for generator';
  const formSummary = mode === 'journal' ? 'Journal · double entry' : `Bank · ${draft.direction === 'in' ? 'money in' : 'money out'}`;

  const balanceLabel = amount === 0 ? 'Awaiting amount' : sameAccount ? 'Same account both sides' : 'Entry balances';
  const balanceColor = ready ? theme.accentWashText : theme.dangerWashText;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Log entry">
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{addRef} · posts to Bhadra 2083</Text>

      <View style={[styles.segmented, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
        <Pressable
          onPress={() => onModeChange('journal')}
          style={[styles.segmentButton, { backgroundColor: mode === 'journal' ? theme.surface : 'transparent', boxShadow: mode === 'journal' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: mode === 'journal' ? theme.textPrimary : theme.textSecondary }]}>Journal entry</Text>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('bank')}
          style={[styles.segmentButton, { backgroundColor: mode === 'bank' ? theme.surface : 'transparent', boxShadow: mode === 'bank' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: mode === 'bank' ? theme.textPrimary : theme.textSecondary }]}>Bank transaction</Text>
        </Pressable>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Amount · NPR</Text>
        <View style={[styles.amountRow, { borderColor: amount ? theme.accent : theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.rupeeSign, { color: theme.textSecondary }]}>रु</Text>
          <TextInput
            value={draft.amount}
            onChangeText={(v) => onChange({ amount: v })}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
            style={[styles.amountInput, { color: theme.textPrimary }]}
          />
        </View>
      </View>

      {mode === 'bank' ? (
        <View style={styles.group}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Direction</Text>
          <View style={styles.directionRow}>
            {(['in', 'out'] as BankDirection[]).map((d) => {
              const on = draft.direction === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => onChange({ direction: d })}
                  style={[styles.directionButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
                >
                  <Text style={[styles.directionLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{d === 'in' ? 'Money in' : 'Money out'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{debitLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
          {PICKS.map((id) => {
            const on = draft.debitAcct === id;
            return (
              <Pressable
                key={id}
                onPress={() => onChange({ debitAcct: id })}
                style={[styles.pickButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.pickCode, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{getAccountCode(id)}</Text>
                <Text style={[styles.pickLabel, { color: on ? theme.onDark.text : theme.textPrimary }]} numberOfLines={1}>
                  {getAccountLabel(id).replace(' · ', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{creditLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickRow}>
          {PICKS.map((id) => {
            const on = draft.creditAcct === id;
            return (
              <Pressable
                key={id}
                onPress={() => onChange({ creditAcct: id })}
                style={[styles.pickButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.pickCode, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{getAccountCode(id)}</Text>
                <Text style={[styles.pickLabel, { color: on ? theme.onDark.text : theme.textPrimary }]} numberOfLines={1}>
                  {getAccountLabel(id).replace(' · ', ' ')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Narration</Text>
        <TextInput
          value={draft.memo}
          onChangeText={(v) => onChange({ memo: v })}
          placeholder={memoPlaceholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.memoInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
        />
      </View>

      <View style={[styles.previewCard, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
        <View style={styles.previewHeader}>
          <Text style={[styles.previewHeadDetail, { color: theme.textSecondary }]}>Preview</Text>
          <Text style={[styles.previewHeadCol, { color: theme.textSecondary }]}>Debit</Text>
          <Text style={[styles.previewHeadCol, { color: theme.textSecondary }]}>Credit</Text>
        </View>
        <View style={[styles.previewRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.previewName, { color: theme.textPrimary }]} numberOfLines={1}>
            {getAccountCode(draft.debitAcct)} · {getAccountLabel(draft.debitAcct)}
          </Text>
          <Text style={[styles.previewCol, tabularNums, { color: theme.textPrimary }]}>{amount ? fmt(amount) : '—'}</Text>
          <Text style={[styles.previewCol, { color: theme.textSecondary }]}>—</Text>
        </View>
        <View style={[styles.previewRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.previewName, { color: theme.textPrimary }]} numberOfLines={1}>
            {getAccountCode(draft.creditAcct)} · {getAccountLabel(draft.creditAcct)}
          </Text>
          <Text style={[styles.previewCol, { color: theme.textSecondary }]}>—</Text>
          <Text style={[styles.previewCol, tabularNums, { color: theme.textPrimary }]}>{amount ? fmt(amount) : '—'}</Text>
        </View>
        <View style={[styles.previewFooter, { borderTopColor: theme.border }]}>
          <Text style={[styles.previewBalanceLabel, { color: balanceColor }]}>{balanceLabel}</Text>
          <Text style={[styles.previewBalanceDiff, tabularNums, { color: balanceColor }]}>{ready ? '0' : '—'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={1}>
            {formSummary}
          </Text>
          <Text style={[styles.summaryDate, tabularNums, { color: theme.textSecondary }]}>23 Aug 2026</Text>
        </View>
        <Pressable onPress={onSave} disabled={!ready} style={[styles.saveButton, { backgroundColor: ready ? theme.accent : theme.draftWash }]}>
          <Text style={[styles.saveLabel, tabularNums, { color: ready ? theme.accentText : theme.draftWashText }]}>
            {ready ? `Post ${money(amount)}` : 'Balance the entry to post'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase', marginTop: -12 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 14, borderWidth: 1, gap: 4 },
  segmentButton: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  group: { gap: 8 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 64, paddingHorizontal: 16, borderRadius: radii.lg - 2, borderWidth: 1 },
  rupeeSign: { fontFamily: fontFamily.mono, fontSize: 15 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '600', letterSpacing: -0.02 * 28, padding: 0 },
  directionRow: { flexDirection: 'row', gap: 8 },
  directionButton: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  directionLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
  pickRow: { gap: 7 },
  pickButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1 },
  pickCode: { fontFamily: fontFamily.mono, fontSize: 10 },
  pickLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  memoInput: { height: 50, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, fontSize: 15 },
  previewCard: { borderRadius: 16, padding: 15 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 },
  previewHeadDetail: { flex: 1, fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  previewHeadCol: { width: 74, textAlign: 'right', fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  previewName: { flex: 1, fontSize: 13.5 },
  previewCol: { width: 74, textAlign: 'right', fontFamily: fontFamily.mono, fontSize: 12 },
  previewFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 11, borderTopWidth: 1.5 },
  previewBalanceLabel: { flex: 1, fontSize: 12.5, fontWeight: '600' },
  previewBalanceDiff: { fontFamily: fontFamily.mono, fontSize: 12 },
  footer: { gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryText: { flex: 1, fontSize: 13.5 },
  summaryDate: { fontSize: 11, flexShrink: 0 },
  saveButton: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 16, fontWeight: '600' },
});
