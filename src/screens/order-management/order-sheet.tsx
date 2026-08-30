import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { STAGES } from '@/data/sales/mock';
import type { OrderDraft, OrderPriority, StageId } from '@/data/sales/types';

export interface OrderSheetProps {
  visible: boolean;
  mode: 'new' | 'edit' | null;
  draft: OrderDraft | null;
  onClose: () => void;
  onChange: (patch: Partial<OrderDraft>) => void;
  onSave: () => void;
}

export function OrderSheet({ visible, mode, draft, onClose, onChange, onSave }: OrderSheetProps) {
  const theme = useTheme();
  if (!draft) return null;

  const canSave = draft.customer.trim().length > 1 && draft.product.trim().length > 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={mode === 'new' ? 'New order' : `Edit ${draft.ref}`}>
      <TextField label="Customer" value={draft.customer} onChangeText={(v) => onChange({ customer: v })} placeholder="Buyer / account name" autoCapitalize="words" />
      <TextField label="Destination" value={draft.city} onChangeText={(v) => onChange({ city: v })} placeholder="City, country" autoCapitalize="words" />
      <TextField label="Product" value={draft.product} onChangeText={(v) => onChange({ product: v })} placeholder="Style / description" autoCapitalize="sentences" />

      <View style={styles.pairRow}>
        <View style={styles.pairCell}>
          <TextField label="Quantity (pcs)" value={draft.qty} onChangeText={(v) => onChange({ qty: v })} placeholder="0" keyboardType="number-pad" />
        </View>
        <View style={styles.pairCell}>
          <TextField label="Order value (NPR)" value={draft.value} onChangeText={(v) => onChange({ value: v })} placeholder="0" keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.pairRow}>
        <View style={styles.pairCell}>
          <TextField label="Customer PO" value={draft.po} onChangeText={(v) => onChange({ po: v })} placeholder="PO ref" autoCapitalize="characters" />
        </View>
        <View style={styles.pairCell}>
          <TextField label="Channel" value={draft.channel} onChangeText={(v) => onChange({ channel: v })} placeholder="Wholesale / DTC…" autoCapitalize="words" />
        </View>
      </View>

      <TextField label="Payment terms" value={draft.terms} onChangeText={(v) => onChange({ terms: v })} placeholder="30 days / Prepaid…" autoCapitalize="sentences" />
      <TextField label="Assigned to" value={draft.assignedTo} onChangeText={(v) => onChange({ assignedTo: v })} placeholder="Owner" autoCapitalize="words" />

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Stage</Text>
        <View style={styles.chipWrap}>
          {STAGES.map((s) => {
            const on = draft.stage === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => onChange({ stage: s.id as StageId })}
                style={[styles.chip, { backgroundColor: on ? s.bg : theme.surface, borderColor: on ? s.dot : theme.border }]}
              >
                <View style={[styles.chipDot, { backgroundColor: s.dot }]} />
                <Text style={[styles.chipLabel, { color: on ? s.fg : theme.textPrimary }]}>{s.short}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
        <View style={styles.prioRow}>
          {(['normal', 'high'] as OrderPriority[]).map((p) => {
            const on = draft.priority === p;
            return (
              <Pressable
                key={p}
                onPress={() => onChange({ priority: p })}
                style={[styles.prioBtn, { backgroundColor: on ? (p === 'high' ? theme.warningWash : theme.surfaceInverted) : theme.surface, borderColor: on ? (p === 'high' ? theme.warning : theme.surfaceInverted) : theme.border }]}
              >
                <Text style={[styles.prioLabel, { color: on ? (p === 'high' ? theme.warningWashText : theme.onDark.text) : theme.textSecondary }]}>
                  {p === 'high' ? 'High' : 'Normal'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={mode === 'new' ? 'Create order' : 'Save changes'} onPress={onSave} disabled={!canSave} fullWidth style={styles.save} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pairRow: { flexDirection: 'row', gap: 10 },
  pairCell: { flex: 1 },
  group: { gap: 9 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.14 * 10, textTransform: 'uppercase' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 99 },
  chipLabel: { fontFamily: fontFamily.medium, fontSize: 12.5 },
  prioRow: { flexDirection: 'row', gap: 8 },
  prioBtn: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  prioLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  footer: { paddingTop: 4 },
  save: { height: 54 },
});
