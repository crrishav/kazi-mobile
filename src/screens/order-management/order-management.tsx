import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { isBlocked, ScreenGate } from '@/components/ui/screen-gate';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import {
  useAddOrder,
  useAddOrderNote,
  useOrders,
  useRestoreOrders,
  useSetOrderPriority,
  useSetOrderStage,
  useSetOrderStatus,
  useUpdateOrder,
} from '@/data/sales/hooks';
import { STAGES, STAGE_IDS, nextOrderRef } from '@/data/sales/mock';
import type { Order, OrderDraft, OrderManagementView, StageId } from '@/data/sales/types';

import { BoardColumn } from './board-column';
import { DetailSheet } from './detail-sheet';
import { OrderListRow } from './order-list-row';
import { OrderSheet } from './order-sheet';

const toNum = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

function draftFrom(order: Order): OrderDraft {
  return {
    id: order.id,
    ref: order.ref,
    customer: order.customer,
    city: order.city,
    product: order.product,
    qty: String(order.qty),
    value: String(order.value),
    po: order.po,
    channel: order.channel,
    terms: order.terms,
    stage: order.stage,
    priority: order.priority,
    assignedTo: order.assignedTo,
  };
}

function emptyDraft(): OrderDraft {
  return { id: null, ref: '', customer: '', city: '', product: '', qty: '', value: '', po: '', channel: 'Wholesale', terms: '30 days', stage: 'sourcing', priority: 'normal', assignedTo: '' };
}

export function OrderManagement() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('order-management');

  const ordersQuery = useOrders();
  const { data: orders } = ordersQuery;
  const addOrder = useAddOrder();
  const updateOrder = useUpdateOrder();
  const setStage = useSetOrderStage();
  const setPriority = useSetOrderPriority();
  const addNote = useAddOrderNote();
  const setStatus = useSetOrderStatus();
  const restoreOrders = useRestoreOrders();

  const [view, setView] = useState<OrderManagementView>('board');
  const [sheetMode, setSheetMode] = useState<'new' | 'edit' | null>(null);
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isBlocked(ordersQuery) || !orders) return <ScreenGate queries={[ordersQuery]} />;

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const activeCount = orders.filter((o) => o.status === 'active' && o.stage !== 'delivered').length;
  const listRows = orders
    .slice()
    .sort((a, b) => STAGE_IDS.indexOf(a.stage) - STAGE_IDS.indexOf(b.stage) || Number(b.priority === 'high') - Number(a.priority === 'high'));

  const patchDraft = (patch: Partial<OrderDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const openNew = () => {
    setDraft(emptyDraft());
    setSheetMode('new');
  };
  const openEdit = (order: Order) => {
    setDraft(draftFrom(order));
    setSheetMode('edit');
  };
  const closeSheet = () => {
    setSheetMode(null);
    setDraft(null);
  };

  const handleSave = () => {
    if (!draft) return;
    const qty = toNum(draft.qty);
    const value = toNum(draft.value);
    if (draft.id) {
      updateOrder.mutate({
        id: draft.id,
        updates: {
          customer: draft.customer.trim(),
          city: draft.city.trim(),
          product: draft.product.trim(),
          qty,
          value,
          po: draft.po.trim(),
          channel: draft.channel.trim(),
          terms: draft.terms.trim(),
          stage: draft.stage,
          priority: draft.priority,
          assignedTo: draft.assignedTo.trim() || 'Unassigned',
        },
      });
      toast.show({ message: `${draft.ref} updated`, tone: 'ok' });
    } else {
      const ref = nextOrderRef(orders);
      const nowISO = new Date().toISOString();
      const order: Order = {
        id: `o${Date.now()}`,
        ref,
        customer: draft.customer.trim(),
        city: draft.city.trim() || '—',
        product: draft.product.trim(),
        qty,
        stage: draft.stage,
        ship: '—',
        shipDays: 30,
        value,
        po: draft.po.trim() || '—',
        channel: draft.channel.trim() || 'Wholesale',
        terms: draft.terms.trim() || '30 days',
        sizes: [],
        priority: draft.priority,
        status: 'active',
        assignedTo: draft.assignedTo.trim() || 'Unassigned',
        stageHistory: [{ stage: draft.stage, at: nowISO }],
        notes: [],
      };
      addOrder.mutate(order);
      toast.show({ message: `${ref} created`, tone: 'ok' });
    }
    closeSheet();
  };

  const moveOrder = (order: Order, dir: -1 | 1) => {
    const idx = STAGE_IDS.indexOf(order.stage);
    const next = STAGE_IDS[idx + dir] as StageId | undefined;
    if (!next) return;
    const before = orders;
    setStage.mutate({ id: order.id, stage: next });
    toast.show({
      message: `${order.ref} → ${STAGES[idx + dir].label}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreOrders.mutate(before) },
    });
  };

  const togglePriority = () => {
    if (!selected) return;
    const next = selected.priority === 'high' ? 'normal' : 'high';
    setPriority.mutate({ id: selected.id, priority: next });
    toast.show({ message: `${selected.ref} priority: ${next}`, tone: 'ok' });
  };

  const addOrderNote = (body: string) => {
    if (!selected) return;
    addNote.mutate({
      id: selected.id,
      note: { id: `n${Date.now()}`, body, at: new Date().toISOString(), who: 'You' },
    });
  };

  const cancelOrder = () => {
    if (!selected) return;
    const before = orders;
    setStatus.mutate({ id: selected.id, status: 'cancelled' });
    toast.show({
      message: `${selected.ref} cancelled`,
      tone: 'bad',
      action: { label: 'Undo', onPress: () => restoreOrders.mutate(before) },
    });
  };

  const restoreOrder = () => {
    if (!selected) return;
    setStatus.mutate({ id: selected.id, status: 'active' });
    toast.show({ message: `${selected.ref} restored`, tone: 'ok' });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Order Management"
        subtitle={`${activeCount} in production · ${orders.length} total`}
        rightSlot={
          <View style={[styles.viewTabs, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
            <Pressable onPress={() => setView('board')} style={[styles.viewTab, { backgroundColor: view === 'board' ? theme.surface : 'transparent' }]}>
              <Text style={[styles.viewTabLabel, { color: view === 'board' ? theme.textPrimary : theme.textSecondary }]}>Board</Text>
            </Pressable>
            <Pressable onPress={() => setView('list')} style={[styles.viewTab, { backgroundColor: view === 'list' ? theme.surface : 'transparent' }]}>
              <Text style={[styles.viewTabLabel, { color: view === 'list' ? theme.textPrimary : theme.textSecondary }]}>List</Text>
            </Pressable>
          </View>
        }
      />

      {!canEdit ? (
        <View style={styles.noticeWrap}>
          <PermissionNotice section="order-management" />
        </View>
      ) : null}

      {view === 'board' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardScroll} contentContainerStyle={styles.board}>
          {STAGES.map((s) => (
            <BoardColumn
              key={s.id}
              stage={s}
              orders={listRows.filter((o) => o.stage === s.id)}
              canEdit={canEdit}
              onOpen={(o) => setSelectedId(o.id)}
              onMove={moveOrder}
            />
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {listRows.length === 0 ? (
            <EmptyState icon="grid" title="No orders" message="Create the first order with the + button." />
          ) : (
            listRows.map((o, i) => <OrderListRow key={o.id} order={o} index={i} onPress={() => setSelectedId(o.id)} />)
          )}
        </ScrollView>
      )}

      {canEdit ? (
        <Pressable
          onPress={openNew}
          style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 12px 26px -12px rgba(20,122,87,0.95)' : undefined }]}
        >
          <Icon name="plus" size={18} color={theme.accentText} />
          <Text style={[styles.fabLabel, { color: theme.accentText }]}>New order</Text>
        </Pressable>
      ) : null}

      <OrderSheet visible={!!sheetMode} mode={sheetMode} draft={draft} onClose={closeSheet} onChange={patchDraft} onSave={handleSave} />

      <DetailSheet
        order={selected}
        canEdit={canEdit}
        onClose={() => setSelectedId(null)}
        onEdit={() => {
          if (selected) openEdit(selected);
          setSelectedId(null);
        }}
        onMove={(dir) => selected && moveOrder(selected, dir)}
        onTogglePriority={togglePriority}
        onAddNote={addOrderNote}
        onCancelOrder={cancelOrder}
        onRestoreOrder={restoreOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noticeWrap: { paddingHorizontal: 20, paddingTop: 12 },
  boardScroll: { flex: 1 },
  board: { padding: 16, gap: 12 },
  list: { padding: 20, paddingTop: 12, paddingBottom: 110, gap: 12 },
  viewTabs: { flexDirection: 'row', padding: 3, borderRadius: 13, borderWidth: 1, gap: 2 },
  viewTab: { height: 30, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  viewTabLabel: { fontFamily: fontFamily.semibold, fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    height: 52,
    paddingLeft: 17,
    paddingRight: 20,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  fabLabel: { fontFamily: fontFamily.semibold, fontSize: 14.5 },
});
