import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { useApplyRoleChanges, usePermissionMatrix } from '@/data/admin-panel/hooks';
import { CURRENT_ADMIN, GROUPS, ROLES } from '@/data/admin-panel/mock';
import type { AccessLevel, DiffRow, RoleKey, SectionDef, SectionId } from '@/data/admin-panel/types';

import { DirtyBar } from './dirty-bar';
import { ReviewSheet } from './review-sheet';
import { RoleChipsBar } from './role-chips-bar';
import { SectionGroupCard } from './section-group-card';
import { SummaryCard } from './summary-card';

export function AdminPanel() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('admin-panel');
  const { data: matrix } = usePermissionMatrix();
  const applyMutation = useApplyRoleChanges();

  const [role, setRole] = useState<RoleKey>('sup');
  const [pending, setPending] = useState<Partial<Record<SectionId, AccessLevel>>>({});
  const [sheetOpen, setSheetOpen] = useState(false);

  const sectionIndex = useMemo(() => {
    const idx: Partial<Record<SectionId, { name: string; group: string }>> = {};
    GROUPS.forEach((g) => g.items.forEach((it) => { idx[it.id] = { name: it.name, group: g.title }; }));
    return idx;
  }, []);

  if (!matrix) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const roleObj = ROLES.find((r) => r.key === role)!;
  const base = matrix[role];
  const dirty = Object.keys(pending).length > 0;

  function levelOf(id: SectionId): AccessLevel {
    const p = pending[id];
    return p !== undefined ? p : base[id];
  }

  function setLevel(id: SectionId, v: AccessLevel) {
    if (!canEdit) return;
    setPending((p) => {
      const next = { ...p };
      if (base[id] === v) delete next[id];
      else next[id] = v;
      return next;
    });
  }

  function lockOf(item: SectionDef): string | null {
    if (item.lock) return item.lock;
    if (item.sensitive && role !== 'hr') return 'HR roles only';
    return null;
  }

  function pickRole(next: RoleKey) {
    if (next === role) return;
    if (dirty) {
      toast.show({ message: 'Review or discard your changes first', tone: 'warn' });
      return;
    }
    setRole(next);
    setPending({});
    setSheetOpen(false);
  }

  function handleToggle(item: SectionDef, lock: string | null) {
    if (lock) {
      toast.show({ message: `${item.name} is locked — ${lock}`, tone: 'bad' });
      return;
    }
    setLevel(item.id, levelOf(item.id) > 0 ? 0 : 1);
  }

  function handleLevel(item: SectionDef, lock: string | null) {
    if (lock) {
      toast.show({ message: `${item.name} is locked — ${lock}`, tone: 'bad' });
      return;
    }
    const lv = levelOf(item.id);
    if (lv === 0) {
      toast.show({ message: `Turn ${item.name} on first`, tone: 'warn' });
      return;
    }
    setLevel(item.id, lv === 2 ? 1 : 2);
  }

  function handleDiscard() {
    setPending({});
    setSheetOpen(false);
    toast.show({ message: 'Changes discarded', tone: 'bad' });
  }

  function handleApply() {
    if (!canEdit) return;
    applyMutation.mutate(
      { role, changes: pending },
      {
        onSuccess: () => {
          toast.show({ message: `Access updated for ${roleObj.label.toLowerCase()} · logged`, tone: 'ok' });
        },
      }
    );
    setPending({});
    setSheetOpen(false);
  }

  const counts = { 0: 0, 1: 0, 2: 0 } as Record<AccessLevel, number>;
  GROUPS.forEach((g) => g.items.forEach((it) => { counts[levelOf(it.id)]++; }));

  const diffs: DiffRow[] = (Object.keys(pending) as SectionId[]).map((id) => ({
    id,
    name: sectionIndex[id]!.name,
    group: sectionIndex[id]!.group,
    from: base[id],
    to: pending[id]!,
  }));

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Admin panel"
        subtitle={`${ROLES.length} roles · 20 sections`}
        rightSlot={<Avatar initials={CURRENT_ADMIN.initials} tint="dark" size="sm" />}
      />
      <RoleChipsBar roles={ROLES} activeRole={role} onPick={pickRole} />

      <ScrollView contentContainerStyle={styles.content}>
        <PermissionNotice section="admin-panel" />
        <SummaryCard role={roleObj} dirty={dirty} pendingCount={Object.keys(pending).length} counts={counts} />

        {GROUPS.map((group, i) => (
          <SectionGroupCard
            key={group.title}
            group={group}
            index={i}
            levelOf={levelOf}
            lockOf={lockOf}
            isChanged={(id) => pending[id] !== undefined}
            onToggle={handleToggle}
            onLevel={handleLevel}
          />
        ))}

        <View style={[styles.noteCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
          <Text style={[styles.noteTitle, { color: theme.textPrimary }]}>How this applies</Text>
          <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
            Applied changes take effect at next sign-in.{'\n'}Every change is written to the audit log with your name.{'\n'}
            Individual overrides live on the person&apos;s record.
          </Text>
        </View>
      </ScrollView>

      {dirty ? (
        <DirtyBar
          count={Object.keys(pending).length}
          peopleCount={roleObj.people}
          onDiscard={handleDiscard}
          onReview={() => setSheetOpen(true)}
        />
      ) : null}

      <ReviewSheet
        visible={sheetOpen && dirty}
        onClose={() => setSheetOpen(false)}
        role={roleObj}
        diffs={diffs}
        applying={applyMutation.isPending}
        onApply={handleApply}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 16, paddingBottom: 110, gap: 18 },
  noteCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 15,
    gap: 6,
  },
  noteTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
  noteBody: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 11 * 1.65,
  },
});
