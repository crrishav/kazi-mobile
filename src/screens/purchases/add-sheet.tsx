import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DualDate } from '@/components/ui/dual-date';
import { Icon } from '@/components/ui/icon';
import { Money } from '@/components/ui/money';
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii, tabularNums } from '@/theme';
import { BANKS, STATUS, SUPPLIERS } from '@/data/purchases/mock';
import { computeTotals } from '@/data/purchases/utils';
import {
  PURCHASE_CATEGORIES,
  PURCHASE_UNITS,
  type PurchaseCategory,
  type PurchaseDraft,
  type PurchaseDraftLine,
  type PurchaseStatus,
} from '@/data/purchases/types';

export interface AddSheetProps {
  visible: boolean;
  draft: PurchaseDraft;
  onClose: () => void;
  onChange: (patch: Partial<PurchaseDraft>) => void;
  onSave: () => void;
  /** Shown as a "Delete purchase" action when editing (embedded use — the standalone screen deletes from its detail view). */
  onDelete?: () => void;
}

const STATUS_OPTIONS: PurchaseStatus[] = ['paid', 'partial', 'unpaid'];
const toNum = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

export function emptyLine(): PurchaseDraftLine {
  return { particulars: '', quantity: '', unit: 'pcs', rate: '' };
}

export function AddSheet({ visible, draft, onClose, onChange, onSave, onDelete }: AddSheetProps) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const editing = draft.id !== null;
  const totals = computeTotals(
    draft.lines.map((l) => ({ quantity: toNum(l.quantity), rate: toNum(l.rate) })),
    toNum(draft.discountAmt),
    draft.vatBill,
  );
  const ready = draft.party.trim().length > 0 && totals.subtotal > 0;

  const patchLine = (index: number, patch: Partial<PurchaseDraftLine>) => {
    onChange({ lines: draft.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) });
  };
  const addLine = () => onChange({ lines: [...draft.lines, emptyLine()] });
  const removeLine = (index: number) => onChange({ lines: draft.lines.filter((_, i) => i !== index) });

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editing ? 'Edit purchase' : 'Add purchase'} maxHeight={720}>
      {/* Party */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Party</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SUPPLIERS.map((s) => {
            const on = draft.party === s;
            return (
              <Pressable
                key={s}
                onPress={() => onChange({ party: s })}
                style={[styles.chip, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Text style={[styles.chipLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TextField value={draft.party} onChangeText={(v) => onChange({ party: v })} placeholder="or type a party name" />
      </View>

      {/* Category */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
        <View style={styles.wrapRow}>
          {PURCHASE_CATEGORIES.map((c: PurchaseCategory) => {
            const on = draft.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => onChange({ category: c })}
                style={[styles.pill, { backgroundColor: on ? theme.accentWash : theme.surface, borderColor: on ? theme.accent : theme.border }]}
              >
                <Text style={[styles.pillLabel, { color: on ? theme.accentWashText : theme.textPrimary }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Line items */}
      <View style={styles.group}>
        <View style={styles.lineHeader}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Line items</Text>
          <Pressable onPress={addLine} style={styles.addLineBtn}>
            <Icon name="plus" size={13} color={theme.link} />
            <Text style={[styles.addLineText, { color: theme.link }]}>Add line</Text>
          </Pressable>
        </View>

        {draft.lines.map((l, i) => {
          const amount = Math.round(toNum(l.quantity) * toNum(l.rate));
          return (
            <View key={i} style={[styles.lineCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.lineTopRow}>
                <TextInput
                  value={l.particulars}
                  onChangeText={(v) => patchLine(i, { particulars: v })}
                  placeholder="Particulars"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.lineParticulars, { color: theme.textPrimary }]}
                />
                {draft.lines.length > 1 ? (
                  <Pressable onPress={() => removeLine(i)} hitSlop={8}>
                    <Icon name="x" size={15} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.lineBottomRow}>
                <TextInput
                  value={l.quantity}
                  onChangeText={(v) => patchLine(i, { quantity: v })}
                  placeholder="Qty"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.lineNum, { color: theme.textPrimary, borderColor: theme.border }]}
                />
                <View style={styles.unitRow}>
                  {PURCHASE_UNITS.slice(0, 4).map((u) => {
                    const on = l.unit === u;
                    return (
                      <Pressable
                        key={u}
                        onPress={() => patchLine(i, { unit: u })}
                        style={[styles.unitChip, { backgroundColor: on ? theme.surfaceInverted : 'transparent', borderColor: on ? theme.surfaceInverted : theme.border }]}
                      >
                        <Text style={[styles.unitText, { color: on ? theme.onDark.text : theme.textSecondary }]}>{u}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={l.rate}
                  onChangeText={(v) => patchLine(i, { rate: v })}
                  placeholder="Rate"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.lineNum, { color: theme.textPrimary, borderColor: theme.border }]}
                />
              </View>
              <Text style={[styles.lineAmount, tabularNums, { color: theme.textSecondary }]}>
                = रु {amount.toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Payment */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Payment type</Text>
        <View style={styles.methodRow}>
          {(['Cash', 'Bank'] as const).map((m) => {
            const on = draft.paymentType === m;
            return (
              <Pressable
                key={m}
                onPress={() => onChange({ paymentType: m })}
                style={[styles.methodButton, { backgroundColor: on ? theme.surfaceInverted : theme.surface, borderColor: on ? theme.surfaceInverted : theme.border }]}
              >
                <Icon name={m === 'Cash' ? 'credit-card' : 'home'} size={17} color={on ? theme.onDark.text : theme.textPrimary} />
                <Text style={[styles.methodLabel, { color: on ? theme.onDark.text : theme.textPrimary }]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
        {draft.paymentType === 'Bank' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {BANKS.map((b) => {
              const on = draft.bankName === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => onChange({ bankName: b })}
                  style={[styles.chip, { backgroundColor: on ? theme.accentWash : theme.surface, borderColor: on ? theme.accent : theme.border }]}
                >
                  <Text style={[styles.chipLabel, { color: on ? theme.accentWashText : theme.textPrimary }]}>{b}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {/* Date */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
        <Pressable onPress={() => setPickerOpen(true)} style={[styles.dateRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DualDate iso={draft.date} inline size={14} />
          <Icon name="calendar" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>

      {/* Discount + VAT */}
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Discount · NPR</Text>
        <View style={[styles.amountRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Text style={[styles.rupeeSign, { color: theme.textSecondary }]}>रु</Text>
          <TextInput
            value={draft.discountAmt}
            onChangeText={(v) => onChange({ discountAmt: v })}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={theme.textSecondary}
            style={[styles.discountInput, { color: theme.textPrimary }]}
          />
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ vatBill: !draft.vatBill })}
        style={[styles.billRow, { backgroundColor: draft.vatBill ? theme.accentWash : theme.surfaceRaised, borderColor: draft.vatBill ? theme.accent : theme.border }]}
      >
        <View style={[styles.billIcon, { backgroundColor: theme.accentWash }]}>
          <Icon name="file-text" size={18} color={theme.accentWashText} />
        </View>
        <View style={styles.billTextWrap}>
          <Text style={[styles.billTitle, { color: theme.textPrimary }]}>{draft.vatBill ? 'VAT bill · 13% applied' : 'No VAT bill'}</Text>
          <Text style={[styles.billHint, { color: theme.textSecondary }]}>
            {draft.vatBill ? 'Tap to remove · input VAT recoverable' : 'Tap if the supplier issued a VAT bill'}
          </Text>
        </View>
      </Pressable>

      {/* Status */}
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

      {/* Totals */}
      <View style={[styles.totalsCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        <TotalRow label="Subtotal" value={totals.subtotal} theme={theme} />
        {totals.discount > 0 ? <TotalRow label="Discount" value={-totals.discount} theme={theme} /> : null}
        <TotalRow label="Taxable" value={totals.taxable} theme={theme} />
        {draft.vatBill ? <TotalRow label="VAT · 13%" value={totals.vat} theme={theme} /> : null}
        <View style={[styles.grandRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.grandLabel, { color: theme.textPrimary }]}>Grand total</Text>
          <Money npr={totals.grandTotal} size={16} align="right" />
        </View>
      </View>

      <Pressable onPress={onSave} disabled={!ready} style={[styles.saveButton, { backgroundColor: ready ? theme.accent : theme.draftWash }]}>
        <Text style={[styles.saveLabel, tabularNums, { color: ready ? theme.accentText : theme.draftWashText }]}>
          {ready ? `${editing ? 'Save changes' : 'Post'} · रु ${totals.grandTotal.toLocaleString('en-IN')}` : 'Add a party and a line item'}
        </Text>
      </Pressable>

      {editing && onDelete ? <Button label="Delete purchase" variant="dangerOutline" onPress={onDelete} /> : null}

      <NepaliDatePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        value={draft.date}
        onChange={(iso) => onChange({ date: iso })}
        title="Purchase date"
      />
    </BottomSheet>
  );
}

function TotalRow({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.totalValue, tabularNums, { color: theme.textPrimary }]}>
        {value < 0 ? '−' : ''}रु {Math.abs(value).toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.11 * 10, textTransform: 'uppercase' },
  chipRow: { gap: 7, paddingVertical: 1 },
  chip: { height: 40, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addLineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLineText: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  lineCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  lineTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineParticulars: { flex: 1, fontSize: 14.5, fontWeight: '600', padding: 0 },
  lineBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineNum: { width: 62, height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 14, textAlign: 'center' },
  unitRow: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center' },
  unitChip: { paddingHorizontal: 8, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  unitText: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  lineAmount: { fontFamily: fontFamily.mono, fontSize: 11, textAlign: 'right' },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodButton: { flex: 1, height: 50, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  methodLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 16, borderRadius: radii.lg - 2, borderWidth: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 16, borderRadius: radii.lg - 2, borderWidth: 1 },
  rupeeSign: { fontFamily: fontFamily.mono, fontSize: 14 },
  discountInput: { flex: 1, fontSize: 18, fontWeight: '600', padding: 0 },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 15 },
  billIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  billTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  billTitle: { fontSize: 13.5, fontWeight: '600' },
  billHint: { fontSize: 11.5, lineHeight: 11.5 * 1.4 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusButton: { flex: 1, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  totalsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.08 * 10.5, textTransform: 'uppercase' },
  totalValue: { fontSize: 13.5, fontWeight: '600' },
  grandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1.5, paddingTop: 10, marginTop: 2 },
  grandLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
  saveButton: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontSize: 15.5, fontWeight: '600' },
});
