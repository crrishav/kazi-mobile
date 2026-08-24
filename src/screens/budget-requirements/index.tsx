import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAddRequirement, useRequirements, useRestoreRequirements, useUpdateRequirement } from '@/data/budget-requirements/hooks';
import { CAP, STATUS, seedRequirements } from '@/data/budget-requirements/mock';
import { money, short } from '@/data/budget-requirements/utils';
import type { Requirement, RequirementDraft, RequirementsFilter, RequirementsView, RequestStatus, Role } from '@/data/budget-requirements/types';

import { AddSheet } from './add-sheet';
import { DetailView } from './detail-view';
import { ListSummary } from './list-summary';
import { RequirementGroup } from './requirement-group';

function emptyDraft(): RequirementDraft {
  return { cat: 'Machinery', item: '', amount: '', priority: 'Medium', by: 'This week', note: '', quote: false };
}

export function BudgetRequirements() {
  const theme = useTheme();
  const toast = useToast();

  const { data: requirements } = useRequirements();
  const addRequirement = useAddRequirement();
  const updateRequirement = useUpdateRequirement();
  const restoreRequirements = useRestoreRequirements();

  const [role, setRole] = useState<Role>('staff');
  const [filter, setFilter] = useState<RequirementsFilter>('all');
  const [view, setView] = useState<RequirementsView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<RequirementDraft>(emptyDraft());

  if (!requirements) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const isAdmin = role === 'admin';
  const selected = requirements.find((r) => r.id === selectedId) ?? null;

  let rows = requirements;
  if (filter === 'pending') rows = rows.filter((r) => r.status === 'pending');
  if (filter === 'high') rows = rows.filter((r) => r.priority === 'High');
  if (filter === 'mine') rows = rows.filter((r) => r.who === 'Sita R.');

  const pending = requirements.filter((r) => r.status === 'pending');
  const approvedTotal = requirements.filter((r) => r.status === 'approved').reduce((n, r) => n + r.amount, 0);
  const pendingTotal = pending.reduce((n, r) => n + r.amount, 0);
  const pct = (n: number) => Math.min(100, Math.round((n / CAP) * 100));

  const buckets: { key: string; title: string; rows: Requirement[] }[] = [
    { key: 'pending', title: isAdmin ? 'Awaiting your decision' : 'Waiting for approval', rows: rows.filter((r) => r.status === 'pending') },
    { key: 'decided', title: 'Decided · August', rows: rows.filter((r) => r.status !== 'pending') },
  ].filter((b) => b.rows.length);

  const filters: { id: RequirementsFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: requirements.length },
    { id: 'pending', label: 'Pending', count: pending.length },
    { id: 'high', label: 'High', count: requirements.filter((r) => r.priority === 'High').length },
    { id: 'mine', label: isAdmin ? 'From Sita' : 'Mine', count: requirements.filter((r) => r.who === 'Sita R.').length },
  ];

  const flash = (message: string, before: Requirement[]) => {
    toast.show({ message, tone: 'ok', action: { label: 'Undo', onPress: () => restoreRequirements.mutate(before) } });
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };
  const backToList = () => {
    setView('list');
    setSelectedId(null);
  };

  const decide = (item: Requirement, status: RequestStatus) => {
    const before = requirements;
    updateRequirement.mutate({ id: item.id, updates: { status, decidedBy: 'A. Karki' } });
    backToList();
    flash(`${item.ref} ${STATUS[status].label.toLowerCase()} · ${money(item.amount)}`, before);
  };

  const openAdd = () => {
    setDraft(emptyDraft());
    setAddOpen(true);
  };

  const handleSubmit = () => {
    const amount = parseInt(draft.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount) {
      toast.show({ message: 'Add an estimated amount to submit', tone: 'bad' });
      return;
    }
    const before = requirements;
    const n = 185 + (requirements.length - seedRequirements.length);
    const entry: Requirement = {
      id: `n${Date.now()}`,
      ref: `REQ-0${n}`,
      item: draft.item.trim() || 'Unspecified requirement',
      cat: draft.cat,
      amount,
      priority: draft.priority,
      status: 'pending',
      who: 'Sita R.',
      init: 'SR',
      team: 'Cutting',
      date: '23 Aug',
      by: draft.by,
      quote: draft.quote ? 'IMG · just now' : 'Not attached',
      note: draft.note.trim() || 'No context given.',
    };
    addRequirement.mutate(entry);
    setAddOpen(false);
    flash(`${entry.ref} sent for approval`, before);
  };

  if (view === 'detail' && selected) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title={selected.item} subtitle={`${selected.ref} · ${selected.cat}`} onBack={backToList} />
        <ScrollView contentContainerStyle={styles.content}>
          <DetailView
            item={selected}
            canDecide={selected.status === 'pending' && isAdmin}
            awaitingAdmin={selected.status === 'pending' && !isAdmin}
            onApprove={() => decide(selected, 'approved')}
            onDecline={() => decide(selected, 'declined')}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Requirements" subtitle={`${requirements.length} raised · August 2026`} />
      <ListSummary
        role={role}
        onRoleChange={(r) => {
          setRole(r);
          setView('list');
          setSelectedId(null);
        }}
        approvedTotal={short(approvedTotal)}
        pendingTotal={short(pendingTotal)}
        capLeft={short(Math.max(0, CAP - approvedTotal))}
        capPct={pct(approvedTotal)}
        pendPct={pct(pendingTotal)}
        capLine={`${pct(approvedTotal)}% committed`}
        capOf={`cap ${short(CAP)}`}
        isAdmin={isAdmin}
        queueTitle={pending.length === 1 ? '1 request needs your decision' : `${pending.length} requests need your decision`}
        queueSub={pending.length ? `${short(pendingTotal)} · oldest ${pending[pending.length - 1].ref}` : 'queue clear'}
        onShowPending={() => setFilter('pending')}
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {rows.length === 0 ? (
          <EmptyState icon="file-text" title="Nothing waiting here" message={`Clear the filter to see all ${requirements.length} requests raised this month.`} />
        ) : (
          buckets.map((b) => <RequirementGroup key={b.key} title={b.title} total={short(b.rows.reduce((n, r) => n + r.amount, 0))} rows={b.rows} isAdmin={isAdmin} onOpen={openDetail} />)
        )}
      </ScrollView>

      <Pressable
        onPress={openAdd}
        style={[styles.fab, { backgroundColor: theme.surfaceInverted, boxShadow: theme.scheme === 'light' ? '0 16px 30px -16px rgba(13,31,25,0.85)' : undefined }]}
      >
        <Icon name="plus" size={18} color={theme.onDark.accent} />
        <Text style={[styles.fabLabel, { color: theme.onDark.text }]}>New request</Text>
      </Pressable>

      <AddSheet
        visible={addOpen}
        draft={draft}
        who={isAdmin ? 'Raised as A. Karki · admin' : 'Raised as Sita R. · Cutting'}
        onClose={() => setAddOpen(false)}
        onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 16 },
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
