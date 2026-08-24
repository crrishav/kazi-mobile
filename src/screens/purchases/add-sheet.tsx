import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import { STATUS, SUPPLIERS } from '@/data/purchases/mock';
import { fmt, money } from '@/data/purchases/utils';
import type { DateOptionId, PurchaseDraft, PurchaseStatus } from '@/data/purchases/types';

export interface AddSheetProps {
  visible: boolean;
  draft: PurchaseDraft;
  onClose: () => void;
  onChange: (patch: Partial<PurchaseDraft>) => void;
  onSave: () => void;
}

const STATUS_OPTIONS: PurchaseStatus[] = ['paid', 'partial', 'unpaid'];
const DATE_OPTIONS: { id: DateOptionId; label: string; sub: string }[] = [
  { id: 'today', label: 'Today', sub: '23 Aug' },
  { id: 'yesterday', label: 'Yesterday', sub: '22 Aug' },
  { id: 'earlier', label: 'Pick', sub: 'calendar' },
];

export function AddSheet({ visible, draft, onClose, onChange, onSave }: AddSheetProps) {
  const theme = useTheme();
  const amountValue = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10) || 0;
  const amountReady = amountValue > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add purchase">
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Recorded as Prakash T.</Text>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Amount · NPR</Text>
        <View style={[styles.amountRow, { borderColor: amountReady ? theme.accent : theme.border, backgroundColor: theme.surface }]}>
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

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Supplier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.supplierRow}>
          {SUPPLIERS.map((s) => {
            const on = draft.supplier === s;
            return (
              <Pressable
                key={s}
                onPress={() => onChange({ supplier: s })}
                style={[styles.supplierButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.supplierLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <TextField label="Item" value={draft.item} onChangeText={(v) => onChange({ item: v })} placeholder="e.g. Anti-Grunge Cotton · 600 m" />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Payment method</Text>
        <View style={styles.methodRow}>
          <Pressable
            onPress={() => onChange({ method: 'Cash' })}
            style={[styles.methodButton, { backgroundColor: draft.method === 'Cash' ? theme.surfaceInverted : theme.surface, borderColor: draft.method === 'Cash' ? theme.surfaceInverted : theme.border }]}
          >
            <Icon name="credit-card" size={18} color={draft.method === 'Cash' ? theme.onDark.text : theme.textPrimary} />
            <Text style={[styles.methodLabel, { color: draft.method === 'Cash' ? theme.onDark.text : theme.textPrimary }]}>Cash</Text>
          </Pressable>
          <Pressable
            onPress={() => onChange({ method: 'Bank' })}
            style={[styles.methodButton, { backgroundColor: draft.method === 'Bank' ? theme.surfaceInverted : theme.surface, borderColor: draft.method === 'Bank' ? theme.surfaceInverted : theme.border }]}
          >
            <Icon name="home" size={18} color={draft.method === 'Bank' ? theme.onDark.text : theme.textPrimary} />
            <Text style={[styles.methodLabel, { color: draft.method === 'Bank' ? theme.onDark.text : theme.textPrimary }]}>Bank</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((id) => {
            const s = STATUS[id];
            const on = draft.status === id;
            return (
              <Pressable
                key={id}
                onPress={() => onChange({ status: id })}
                style={[styles.statusButton, { backgroundColor: on ? s.bg : theme.surface, borderColor: on ? s.dot : theme.border }]}
              >
                <Text style={[styles.statusLabel, { color: on ? s.fg : theme.textPrimary }]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
        <View style={styles.dateRow}>
          {DATE_OPTIONS.map((d) => {
            const on = draft.date === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => onChange({ date: d.id })}
                style={[styles.dateButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.dateLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{d.label}</Text>
                <Text style={[styles.dateSub, tabularNums, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{d.sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ bill: !draft.bill })}
        style={[styles.billRow, { backgroundColor: draft.bill ? theme.accentWash : theme.surfaceRaised, borderColor: draft.bill ? theme.accent : theme.border }]}
      >
        <View style={[styles.billIcon, { backgroundColor: theme.accentWash }]}>
          <Icon name="upload" size={18} color={theme.accentWashText} />
        </View>
        <View style={styles.billTextWrap}>
          <Text style={[styles.billTitle, { color: theme.textPrimary }]}>{draft.bill ? 'bill-0413.jpg attached' : 'Attach the bill'}</Text>
          <Text style={[styles.billHint, { color: theme.textSecondary }]}>
            {draft.bill ? '1.1 MB · tap to remove' : 'Tap to upload · photo of the paper bill'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: theme.textSecondary }]} numberOfLines={1}>
            {draft.supplier} · {draft.method.toLowerCase()} · {STATUS[draft.status].label.toLowerCase()}
          </Text>
          <Text style={[styles.summaryDate, tabularNums, { color: theme.textSecondary }]}>
            {draft.date === 'today' ? '23 Aug 2026' : draft.date === 'yesterday' ? '22 Aug 2026' : 'Choose date'}
          </Text>
        </View>
        <Pressable
          onPress={onSave}
          disabled={!amountReady}
          style={[styles.saveButton, { backgroundColor: amountReady ? theme.accent : theme.draftWash }]}
        >
          <Text style={[styles.saveLabel, tabularNums, { color: amountReady ? theme.accentText : theme.draftWashText }]}>
            {amountReady ? `Save ${money(amountValue)}` : 'Enter an amount'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase', marginTop: -12 },
  group: { gap: 8 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 64, paddingHorizontal: 16, borderRadius: radii.lg - 2, borderWidth: 1 },
  rupeeSign: { fontFamily: fontFamily.mono, fontSize: 15 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '600', letterSpacing: -0.02 * 28, padding: 0 },
  supplierRow: { gap: 7 },
  supplierButton: { height: 42, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  supplierLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodButton: { flex: 1, height: 54, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  methodLabel: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusButton: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateButton: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dateLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  dateSub: { fontFamily: fontFamily.mono, fontSize: 9.5, opacity: 0.9 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 18 },
  billIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  billTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  billTitle: { fontSize: 14, fontWeight: '600' },
  billHint: { fontSize: 12, lineHeight: 12 * 1.45 },
  footer: { gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summaryText: { flex: 1, fontSize: 13.5 },
  summaryDate: { fontSize: 11, flexShrink: 0 },
  saveButton: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 16, fontWeight: '600' },
});
