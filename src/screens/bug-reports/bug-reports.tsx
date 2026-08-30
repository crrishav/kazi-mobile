import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import {
  useAddBugReport,
  useBugReports,
  useRestoreBugReports,
  useUpdateBugStatus,
} from '@/data/bug-reports/hooks';
import { NEXT_STATUS, SEVERITY_META } from '@/data/bug-reports/mock';
import type { BugReportDraft, SeverityFilter, StatusFilter } from '@/data/bug-reports/types';

import { DetailSheet } from './detail-sheet';
import { FilterBar } from './filter-bar';
import { ReportRow } from './report-row';
import { ReportSheet } from './report-sheet';

const EMPTY_DRAFT: BugReportDraft = { title: '', area: 'Other', severity: 'medium', steps: '', screenshot: false };

export function BugReports() {
  const theme = useTheme();
  const toast = useToast();
  const { can, profile } = useAuth();
  const canEdit = can('bug-report');

  const { data: reports } = useBugReports();
  const addReport = useAddBugReport();
  const updateStatus = useUpdateBugStatus();
  const restoreReports = useRestoreBugReports();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [draft, setDraft] = useState<BugReportDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!reports) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  let rows = reports;
  if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
  if (severityFilter !== 'all') rows = rows.filter((r) => r.severity === severityFilter);
  rows = rows
    .slice()
    .sort((a, b) => SEVERITY_META[b.severity].order - SEVERITY_META[a.severity].order || b.createdAt.localeCompare(a.createdAt));

  const openCount = reports.filter((r) => r.status === 'open' || r.status === 'in-progress').length;

  const patchDraft = (patch: Partial<BugReportDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const handleSubmit = () => {
    if (!draft) return;
    addReport.mutate(
      { draft, reportedBy: profile?.name ?? 'You' },
      { onSuccess: (created) => toast.show({ message: `${created.ref} submitted`, tone: 'ok' }) },
    );
    setDraft(null);
  };

  const changeStatus = (advance: boolean) => {
    if (!selected) return;
    const nextStatus = advance ? NEXT_STATUS[selected.status] : 'open';
    if (!nextStatus) return;
    const before = reports;
    updateStatus.mutate({ id: selected.id, status: nextStatus });
    toast.show({
      message: `${selected.ref} → ${nextStatus === 'in-progress' ? 'in progress' : nextStatus}`,
      tone: 'ok',
      action: { label: 'Undo', onPress: () => restoreReports.mutate(before) },
    });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Bug Report" subtitle={`${openCount} open · ${reports.length} total`} />

      <ScrollView contentContainerStyle={styles.content}>
        {!canEdit ? <PermissionNotice section="bug-report" message="View only — you can’t file or update reports here." /> : null}

        <FilterBar
          reports={reports}
          status={statusFilter}
          severity={severityFilter}
          onStatusChange={setStatusFilter}
          onSeverityChange={setSeverityFilter}
        />

        {rows.length === 0 ? (
          <EmptyState icon="check-circle" title="Nothing here" message="No reports match these filters." />
        ) : (
          rows.map((r, i) => <ReportRow key={r.id} report={r} index={i} onPress={() => setSelectedId(r.id)} />)
        )}
      </ScrollView>

      {canEdit ? (
        <Pressable
          onPress={() => setDraft({ ...EMPTY_DRAFT })}
          style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 12px 26px -12px rgba(20,122,87,0.95)' : undefined }]}
        >
          <Icon name="plus" size={24} color={theme.accentText} />
        </Pressable>
      ) : null}

      <ReportSheet visible={!!draft} draft={draft} onClose={() => setDraft(null)} onChange={patchDraft} onSubmit={handleSubmit} />

      <DetailSheet
        report={selected}
        canEdit={canEdit}
        onClose={() => setSelectedId(null)}
        onAdvance={() => changeStatus(true)}
        onReopen={() => changeStatus(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 100, gap: 12 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
