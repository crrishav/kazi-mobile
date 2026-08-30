import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusPill, type StatusKind } from '@/components/ui/status-pill';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAddBatch, useBatches, useUpdateBatch } from '@/data/production/hooks';
import { DUE_OPTIONS, STAGES, STATUS_LABEL, seedBatches } from '@/data/production/mock';
import type { Batch, BatchDraft, BatchOutputDraft, BatchStatus, ProductionFilter, ProductionView } from '@/data/production/types';
import { stageIndexOf } from '@/data/production/utils';

import { AddSheet } from './add-sheet';
import { BatchCard } from './batch-card';
import { BoardTabs } from './board-tabs';
import { CalendarView } from './calendar-view';
import { DetailView } from './detail-view';
import { FilterChips } from './filter-chips';
import { OutputSheet } from './output-sheet';

const toNum = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

function emptyOutputDraft(): BatchOutputDraft {
  return { checked: '', passed: '', failed: '' };
}

const PILL_KIND: Record<BatchStatus, StatusKind> = {
  active: 'on-track',
  hold: 'at-risk',
  cancelled: 'blocked',
  done: 'shipped',
};

function emptyDraft(): BatchDraft {
  return { product: '', qty: '', ref: '', stage: 'received', due: 'd29', person: 'sr', photo: false };
}

export function Production() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('production');

  const { data: batches } = useBatches();
  const addBatch = useAddBatch();
  const updateBatch = useUpdateBatch();

  const [view, setView] = useState<ProductionView>('list');
  const [filter, setFilter] = useState<ProductionFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [draft, setDraft] = useState<BatchDraft>(emptyDraft());
  const [outputOpen, setOutputOpen] = useState(false);
  const [outputDraft, setOutputDraft] = useState<BatchOutputDraft>(emptyOutputDraft());

  if (!batches) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = batches.find((b) => b.id === selectedId) ?? null;
  const activeCount = batches.filter((b) => b.status === 'active' || b.status === 'hold').length;

  const patch = (id: string, updates: Partial<Batch>) => updateBatch.mutate({ id, updates });
  const flash = (message: string, tone: 'ok' | 'bad' = 'ok') => toast.show({ message, tone });

  const counted = (key: ProductionFilter) =>
    key === 'all'
      ? batches.length
      : key === 'cancelled'
        ? batches.filter((b) => b.status === 'cancelled').length
        : batches.filter((b) => b.stage === key && b.status !== 'cancelled').length;

  const filters: { id: ProductionFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counted('all') },
    ...STAGES.slice(1, 5).map((s) => ({ id: s.key as ProductionFilter, label: s.label, count: counted(s.key as ProductionFilter) })),
    { id: 'cancelled', label: 'Cancelled', count: counted('cancelled') },
  ];

  const visible = batches.filter((b) =>
    filter === 'all' ? true : filter === 'cancelled' ? b.status === 'cancelled' : b.stage === filter && b.status !== 'cancelled',
  );

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
    setNoteDraft('');
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleAddPhoto = () => {
    if (!selected || !canEdit) return;
    patch(selected.id, { photos: [{ label: 'Floor capture', time: 'just now' }, ...selected.photos] });
    flash('Photo attached to batch');
  };

  const handleAddNote = () => {
    if (!selected || !canEdit) return;
    const body = noteDraft.trim();
    if (!body) return;
    patch(selected.id, { notes: [...selected.notes, { id: `n${Date.now()}`, who: 'sr', body, time: 'just now', photo: null }] });
    setNoteDraft('');
  };

  const handleAdvance = () => {
    if (!selected || !canEdit) return;
    const i = stageIndexOf(selected);
    if (i >= STAGES.length - 1) return;
    const next = STAGES[i + 1];
    patch(selected.id, {
      stage: next.key,
      status: next.key === 'delivered' ? 'done' : selected.status,
      notes: [...selected.notes, { id: `n${Date.now()}`, who: 'system', body: `Stage advanced to ${next.label}.`, time: 'just now', photo: null }],
    });
    flash(`Moved to ${next.label}`);
  };

  const handleCancel = () => {
    if (!selected || !canEdit) return;
    patch(selected.id, { status: 'cancelled' });
    flash('Batch cancelled', 'bad');
  };

  const openOutput = () => {
    if (!selected || !canEdit) return;
    const o = selected.output;
    setOutputDraft(o ? { checked: String(o.checked), passed: String(o.passed), failed: String(o.failed) } : emptyOutputDraft());
    setOutputOpen(true);
  };

  const handleSaveOutput = () => {
    if (!selected) return;
    const checked = toNum(outputDraft.checked);
    const passed = toNum(outputDraft.passed);
    const failed = outputDraft.failed.trim() !== '' ? toNum(outputDraft.failed) : Math.max(0, checked - passed);
    if (checked <= 0 || passed + failed > checked) {
      flash('Check the counts — passed + failed can’t exceed checked', 'bad');
      return;
    }
    patch(selected.id, {
      output: { checked, passed, failed },
      notes: [...selected.notes, { id: `n${Date.now()}`, who: 'system', body: `Output logged · ${passed}/${checked} passed (${failed} failed).`, time: 'just now', photo: null }],
    });
    setOutputOpen(false);
    flash('Output logged');
  };

  const openAdd = () => {
    if (!canEdit) return;
    setDraft(emptyDraft());
    setAddOpen(true);
  };

  const handleCreate = () => {
    const stage = STAGES.find((s) => s.key === draft.stage) ?? STAGES[0];
    const due = DUE_OPTIONS.find((d) => d.id === draft.due) ?? DUE_OPTIONS[0];
    const product = draft.product.trim() || 'Untitled batch';
    const newBatch: Batch = {
      id: `b${Date.now()}`,
      product,
      code: `BATCH-${119 + batches.length - seedBatches.length}`,
      ref: draft.ref.trim() || '—',
      qty: draft.qty.trim() || '—',
      due: due.label,
      stage: stage.key,
      status: 'active',
      person: draft.person,
      day: due.day,
      photos: draft.photo ? [{ label: 'Reference shot', time: 'just now' }] : [],
      notes: [{ id: 'n1', who: 'system', body: `Batch created at ${stage.label}.`, time: 'just now', photo: null }],
    };
    addBatch.mutate(newBatch);
    setAddOpen(false);
    flash('Batch created');
  };

  if (view === 'detail' && selected) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={selected.product}
          subtitle={`${selected.code} · ${selected.qty}`}
          onBack={backToList}
          rightSlot={<StatusPill status={PILL_KIND[selected.status]} label={STATUS_LABEL[selected.status]} />}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <PermissionNotice section="production" />
          <DetailView
            batch={selected}
            noteDraft={noteDraft}
            onNoteDraft={setNoteDraft}
            onAddNote={handleAddNote}
            onAddPhoto={handleAddPhoto}
            onLogOutput={openOutput}
            onAdvance={handleAdvance}
            onCancel={handleCancel}
          />
        </ScrollView>

        <OutputSheet
          visible={outputOpen}
          batch={selected}
          draft={outputDraft}
          onClose={() => setOutputOpen(false)}
          onChange={(p) => setOutputDraft((d) => ({ ...d, ...p }))}
          onSubmit={handleSaveOutput}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Production" subtitle={`${activeCount} active batches`} rightSlot={<Avatar initials="SR" tint="dark" size="lg" />} />
      <BoardTabs view={view} onList={() => setView('list')} onCalendar={() => setView('calendar')} />

      <ScrollView contentContainerStyle={styles.content}>
        <PermissionNotice section="production" />
        {view === 'list' ? (
          <>
            <FilterChips filters={filters} active={filter} onChange={setFilter} />
            {visible.length === 0 ? (
              <EmptyState icon="inbox" title="No batches here" message="Nothing at this stage right now." />
            ) : (
              visible.map((b, i) => <BatchCard key={b.id} batch={b} index={i} onPress={() => openDetail(b.id)} />)
            )}
          </>
        ) : (
          <CalendarView batches={batches} />
        )}
      </ScrollView>

      {view === 'list' && canEdit ? (
        <Pressable
          onPress={openAdd}
          style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 12px 26px -12px rgba(20,122,87,0.95)' : undefined }]}
        >
          <Icon name="plus" size={18} color={theme.accentText} />
          <Text style={[styles.fabLabel, { color: theme.accentText }]}>Add batch</Text>
        </Pressable>
      ) : null}

      <AddSheet visible={addOpen} draft={draft} onClose={() => setAddOpen(false)} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} onCreate={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 110, gap: 12 },
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
