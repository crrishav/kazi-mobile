import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { HeaderAccount } from '@/components/ui/header-account';
import { ScreenHeader } from '@/components/ui/screen-header';
import { toCSV } from '@/lib/export/csv';
import { useTheme } from '@/theme/theme-provider';
import {
  useClockStatus,
  useMyMonth,
  useSetMemberStatus,
  useTeamRoster,
  useToggleClock,
} from '@/data/attendance/hooks';
import { MY_NAME, STATUS_LABELS } from '@/data/attendance/mock';
import { todayLabel } from '@/data/attendance/utils';
import type { AttendanceStatus, AttendanceView, TeamFilter, TeamMember } from '@/data/attendance/types';

import { MemberSheet } from './member-sheet';
import { MineView } from './mine-view';
import { TabsHeader } from './tabs-header';
import { TeamView } from './team-view';
import { useGeoClockIn } from './use-geo-clock-in';

export function Attendance() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { profile, can } = useAuth();
  const staffName = profile?.name ?? MY_NAME;
  const canEdit = can('attendance');

  const { data: clockStatus } = useClockStatus();
  const toggleClock = useToggleClock();
  const geoClock = useGeoClockIn();
  const { data: team } = useTeamRoster();
  const { data: month } = useMyMonth();
  const setMemberStatus = useSetMemberStatus();
  // Stable for the session — the label only turns over at midnight in Kathmandu.
  const today = useMemo(todayLabel, []);

  const [view, setView] = useState<AttendanceView>('mine');
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [elapsed, setElapsed] = useState(0);
  const [rollEdit, setRollEdit] = useState(false);
  const [rollEdits, setRollEdits] = useState(0);
  const [reportMember, setReportMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    // Re-seed from the server on first load and whenever the session changes —
    // a new clock-in, or a clock-out made on another device / the web.
    if (clockStatus) setElapsed(clockStatus.elapsedSeconds);
  }, [clockStatus?.clockedIn, clockStatus?.inTime, clockStatus?.outTime]);

  useEffect(() => {
    if (!clockStatus?.clockedIn) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [clockStatus?.clockedIn]);

  if (!clockStatus || !team) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const counts: Record<TeamFilter, number> = { all: team.length, present: 0, late: 0, absent: 0, half: 0, leave: 0 };
  team.forEach((m) => {
    counts[m.status] += 1;
  });
  const filteredMembers = team.filter((m) => filter === 'all' || m.status === filter);

  // GPS geofenced clock-in (item 26) — take a fix, verify against WORK_SITE, then punch.
  const finishClockIn = async (coords: { lat: number; lng: number; accuracyM: number } | null) => {
    const next = await toggleClock.mutateAsync({ elapsedSeconds: elapsed, staffName, coords, bypassUsed: false });
    geoClock.reset();
    const p = next.lastPunch;
    if (!p) return;
    if (p.status === 'Late') {
      toast.show({
        message: `Clocked in · ${p.lateMinutes} min late${p.lateCutApplied ? ' · salary cut applied' : ''}`,
        tone: p.lateCutApplied ? 'warn' : 'ok',
      });
    } else {
      toast.show({ message: 'Clocked in · at the workshop, on time', tone: 'ok' });
    }
  };

  const handleToggleClock = async () => {
    if (clockStatus?.clockedIn) {
      await toggleClock.mutateAsync({ elapsedSeconds: elapsed, staffName, coords: null, bypassUsed: false });
      geoClock.reset();
      return;
    }
    const res = await geoClock.locate();
    if (res.ok && res.coords) {
      await finishClockIn(res.coords);
    }
    // otherwise the clock card shows the blocked banner — clock-in needs a valid on-site fix
  };

  const handleRaiseCorrection = () => toast.show({ message: 'Correction request sent · HR reviews within 2 working days', tone: 'ok' });

  // Admin roll-call editor (item 27) — set a staffer's status for the day, with undo.
  const handleSetStatus = (id: number, status: AttendanceStatus) => {
    if (!canEdit) return;
    const target = team?.find((m) => m.id === id);
    if (!target || target.status === status) return;
    const prevStatus = target.status;
    setMemberStatus.mutate({ id, name: target.name, status });
    setRollEdits((n) => n + 1);
    toast.show({
      message: `${target.name} · ${STATUS_LABELS[status]}`,
      tone: 'ok',
      action: {
        label: 'Undo',
        onPress: () => {
          // Re-apply the prior status — works against Firestore and the mock alike.
          setMemberStatus.mutate({ id, name: target.name, status: prevStatus });
          setRollEdits((n) => Math.max(0, n - 1));
        },
      },
    });
  };

  const handleToggleEdit = () => {
    if (!canEdit) return;
    if (rollEdit) {
      if (rollEdits > 0) toast.show({ message: `Roll call saved · ${rollEdits} ${rollEdits === 1 ? 'change' : 'changes'} · ${today}`, tone: 'ok' });
      setRollEdits(0);
    }
    setRollEdit((v) => !v);
  };

  // Real CSV export (item 27) — the roll call, or one staffer's month, to the clipboard.
  const exportCsv = async (csv: string, label: string) => {
    await Clipboard.setStringAsync(csv);
    toast.show({ message: `${label} copied as CSV`, tone: 'ok' });
  };

  const handleExportRollCall = () => {
    if (!team) return;
    const csv = toCSV(team, [
      { header: 'Name', value: (m) => m.name },
      { header: 'Role', value: (m) => m.role },
      { header: 'Status', value: (m) => STATUS_LABELS[m.status] },
      { header: 'Times', value: (m) => m.times },
      { header: 'Hours', value: (m) => m.hours },
    ]);
    void exportCsv(csv, `Roll call · ${today}`);
  };


  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Attendance"
        subtitle={month ? `${today} · ${month.shiftLabel}` : today}
        rightSlot={<HeaderAccount />}
      />
      {canEdit ? <TabsHeader view={view} onChange={setView} /> : null}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        {view === 'mine' || !canEdit ? (
          <MineView
            clockedIn={clockStatus.clockedIn}
            inTime={clockStatus.inTime}
            outTime={clockStatus.outTime}
            elapsedSeconds={elapsed}
            onToggleClock={handleToggleClock}
            onRaiseCorrection={handleRaiseCorrection}
            geoState={geoClock.state}
            geo={geoClock.geo}
            lastPunch={clockStatus.lastPunch}
            onOpenSettings={geoClock.openSettings}
            month={month}
          />
        ) : (
          <TeamView
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
            members={filteredMembers}
            editMode={rollEdit}
            edits={rollEdits}
            onToggleEdit={handleToggleEdit}
            onSetStatus={handleSetStatus}
            onOpenReport={setReportMember}
            onExportPayroll={handleExportRollCall}
          />
        )}
      </ScrollView>

      <MemberSheet
        visible={reportMember !== null}
        member={reportMember}
        canEdit={canEdit}
        onClose={() => setReportMember(null)}
        onExport={(csv, label) => void exportCsv(csv, label)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Attendance pushes as a sibling of (tabs) — the tab bar is hidden, so the
  // bottom pad is just the safe-area inset (applied inline), not room for a bar.
  content: { padding: 20, paddingTop: 4, gap: 16 },
});
