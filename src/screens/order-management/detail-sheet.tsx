import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { STAGES, STAGE_IDS } from '@/data/sales/mock';
import type { Order } from '@/data/sales/types';
import { lakh } from '@/data/sales/utils';

export interface DetailSheetProps {
  order: Order | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
  onTogglePriority: () => void;
  onAddNote: (body: string) => void;
  onCancelOrder: () => void;
  onRestoreOrder: () => void;
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function DetailSheet({
  order,
  canEdit,
  onClose,
  onEdit,
  onMove,
  onTogglePriority,
  onAddNote,
  onCancelOrder,
  onRestoreOrder,
}: DetailSheetProps) {
  const theme = useTheme();
  const [note, setNote] = useState('');
  if (!order) return null;

  const stageIdx = STAGE_IDS.indexOf(order.stage);
  const stage = STAGES[stageIdx];
  const cancelled = order.status === 'cancelled';

  const facts = [
    { label: 'Reference', value: order.ref },
    { label: 'Customer PO', value: order.po },
    { label: 'Destination', value: order.city },
    { label: 'Channel', value: order.channel },
    { label: 'Payment terms', value: order.terms },
    { label: 'Assigned to', value: order.assignedTo },
    { label: 'Quantity', value: `${order.qty.toLocaleString()} pcs` },
    { label: 'Order value', value: lakh(order.value) },
  ];

  const submitNote = () => {
    const body = note.trim();
    if (!body) return;
    onAddNote(body);
    setNote('');
  };

  return (
    <BottomSheet visible={!!order} onClose={onClose} title={order.customer}>
      <View style={styles.headRow}>
        <View style={[styles.pill, { backgroundColor: stage.bg }]}>
          <View style={[styles.pillDot, { backgroundColor: stage.dot }]} />
          <Text style={[styles.pillLabel, { color: stage.fg }]}>{cancelled ? 'Cancelled' : stage.label}</Text>
        </View>
        {order.priority === 'high' ? (
          <View style={[styles.prioTag, { backgroundColor: theme.warningWash }]}>
            <Text style={[styles.prioText, { color: theme.warningWashText }]}>High priority</Text>
          </View>
        ) : null}
        <View style={styles.flex1} />
        {canEdit ? (
          <Pressable onPress={onEdit} hitSlop={8} style={[styles.editBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Icon name="edit-2" size={13} color={theme.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      {canEdit && !cancelled ? (
        <View style={styles.moveRow}>
          <Button label="Back a stage" variant="secondary" size="small" onPress={() => onMove(-1)} disabled={stageIdx <= 0} style={styles.moveBtn} />
          <Button label="Advance stage" size="small" onPress={() => onMove(1)} disabled={stageIdx >= STAGE_IDS.length - 1} style={styles.moveBtn} />
        </View>
      ) : null}

      <View style={styles.factsGrid}>
        {facts.map((f) => (
          <View key={f.label} style={[styles.factCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.factLabel, { color: theme.textSecondary }]}>{f.label}</Text>
            <Text style={[styles.factValue, tabularNums, { color: theme.textPrimary }]}>{f.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Stage history</Text>
        {order.stageHistory.map((h, i) => {
          const s = STAGES.find((x) => x.id === h.stage);
          return (
            <View key={`${h.stage}-${i}`} style={styles.histRow}>
              <View style={[styles.histDot, { backgroundColor: s?.dot ?? theme.border }]} />
              <Text style={[styles.histStage, { color: theme.textPrimary }]}>{s?.label ?? h.stage}</Text>
              <Text style={[styles.histWhen, tabularNums, { color: theme.textSecondary }]}>{when(h.at)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notes</Text>
        {order.notes.length === 0 ? (
          <Text style={[styles.noNotes, { color: theme.textSecondary }]}>No notes yet.</Text>
        ) : (
          order.notes.map((n) => (
            <View key={n.id} style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.noteBody, { color: theme.textPrimary }]}>{n.body}</Text>
              <Text style={[styles.noteMeta, tabularNums, { color: theme.textSecondary }]}>
                {n.who} · {when(n.at)}
              </Text>
            </View>
          ))
        )}
        {canEdit ? (
          <View style={styles.noteInputRow}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note…"
              placeholderTextColor={theme.textSecondary}
              style={[styles.noteInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            />
            <Button label="Add" size="small" onPress={submitNote} disabled={!note.trim()} />
          </View>
        ) : null}
      </View>

      {canEdit ? (
        <View style={styles.footer}>
          <Button label={cancelled ? 'Priority: ' + (order.priority === 'high' ? 'High' : 'Normal') : `Make ${order.priority === 'high' ? 'normal' : 'high'} priority`} variant="secondary" onPress={onTogglePriority} fullWidth disabled={cancelled} />
          {cancelled ? (
            <Button label="Restore order" onPress={onRestoreOrder} fullWidth />
          ) : (
            <Button label="Cancel order" variant="dangerOutline" onPress={onCancelOrder} fullWidth />
          )}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  prioTag: { height: 22, paddingHorizontal: 8, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  prioText: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.08 * 9, textTransform: 'uppercase' },
  flex1: { flex: 1 },
  editBtn: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moveRow: { flexDirection: 'row', gap: 8 },
  moveBtn: { flex: 1 },
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  factCard: { width: '47%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 5 },
  factLabel: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.11 * 9, textTransform: 'uppercase' },
  factValue: { fontSize: 13.5, fontWeight: '600' },
  section: { gap: 8 },
  sectionLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.14 * 10, textTransform: 'uppercase' },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  histDot: { width: 8, height: 8, borderRadius: 99, flexShrink: 0 },
  histStage: { flex: 1, fontSize: 13.5 },
  histWhen: { fontFamily: fontFamily.mono, fontSize: 10.5, flexShrink: 0 },
  noNotes: { fontFamily: fontFamily.mono, fontSize: 11 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 11, gap: 5 },
  noteBody: { fontSize: 13, lineHeight: 13 * 1.45 },
  noteMeta: { fontFamily: fontFamily.mono, fontSize: 9.5 },
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteInput: { flex: 1, height: 44, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, fontSize: 14 },
  footer: { gap: 10, paddingTop: 4 },
});
