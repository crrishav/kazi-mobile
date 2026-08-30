import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { HeaderAccount } from '@/components/ui/header-account';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { toCSV } from '@/lib/export/csv';
import { useTheme } from '@/theme/theme-provider';
import {
  useClockStatus,
  useSetMemberStatus,
  useTeamRoster,
  useToggleClock,
} from '@/data/attendance/hooks';
import { DEFAULT_CLOCK_STATUS, MONTH_LABEL, MY_NAME, STATUS_LABELS, TODAY_LABEL } from '@/data/attendance/mock';
import type { AttendanceStatus, AttendanceView, TeamFilter, TeamMember } from '@/data/attendance/types';

import { EmployeeReportSheet } from './employee-report-sheet';
import { MineView } from './mine-view';
import { TabsHeader } from './tabs-header';
import { TeamView } from './team-view';
import { useGeoClockIn } from './use-geo-clock-in';

export function Attendance() {
  const theme = useTheme();
  const toast = useToast();
  const { profile, can } = useAuth();
  const staffName = profile?.name ?? MY_NAME;
  const canEdit = can('attendance');

  const { data: clockStatus } = useClockStatus();
  const toggleClock = useToggleClock();
  const geoClock = useGeoClockIn();
  const { data: team } = useTeamRoster();
  const setMemberStatus = useSetMemberStatus();

  const [view, setView] = useState<AttendanceView>('mine');
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [elapsed, setElapsed] = useState(DEFAULT_CLOCK_STATUS.elapsedSeconds);
  const [hasSynced, setHasSynced] = useState(false);
  const [rollEdit, setRollEdit] = useState(false);
  const [rollEdits, setRollEdits] = useState(0);
  const [reportMember, setReportMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (clockStatus && !hasSynced) {
      setElapsed(clockStatus.elapsedSeconds);
      setHasSynced(true);
    }
  }, [clockStatus, hasSynced]);

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
  const finishClockIn = async (
    coords: { lat: number; lng: number; accuracyM: number } | null,
    bypassUsed: boolean,
  ) => {
    const next = await toggleClock.mutateAsync({ elapsedSeconds: elapsed, staffName, coords, bypassUsed });
    geoClock.reset();
    const p = next.lastPunch;
    if (!p) return;
    if (p.status === 'Late') {
      toast.show({
        message: `Clocked in · ${p.lateMinutes} min late${p.lateCutApplied ? ' · salary cut applied' : ''}`,
        tone: p.lateCutApplied ? 'warn' : 'ok',
      });
    } else if (bypassUsed) {
      toast.show({ message: 'Clocked in · geofence bypassed, flagged for review', tone: 'warn' });
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
      await finishClockIn(res.coords, false);
    }
    // otherwise the clock card shows the blocked banner + "Clock in anyway"
  };

  const handleBypassClockIn = () => {
    void finishClockIn(geoClock.coordsRef.current, true);
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
      if (rollEdits > 0) toast.show({ message: `Roll call saved · ${rollEdits} ${rollEdits === 1 ? 'change' : 'changes'} · ${TODAY_LABEL}`, tone: 'ok' });
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
    void exportCsv(csv, `Roll call · ${TODAY_LABEL}`);
  };

  const handleExportReport = () => {
    if (!reportMember) return;
    const m = reportMember;
    const csv = toCSV(
      [
        { k: 'Present', v: m.month.present },
        { k: 'Late', v: m.month.late },
        { k: 'Absent', v: m.month.absent },
        { k: 'Half-day', v: m.month.half },
        { k: 'Leave', v: m.month.leave },
        { k: 'OT hours', v: m.month.otHours },
        { k: 'Hours MTD', v: m.month.hoursMTD },
      ],
      [
        { header: 'Metric', value: (r) => r.k },
        { header: `${m.name} · ${MONTH_LABEL}`, value: (r) => r.v },
      ],
    );
    void exportCsv(csv, `${m.name} · ${MONTH_LABEL}`);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Attendance" subtitle="Tue 26 Aug · Shift A" rightSlot={<HeaderAccount />} />
      <TabsHeader view={view} onChange={setView} />

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'mine' ? (
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
            onBypassClockIn={handleBypassClockIn}
            onOpenSettings={geoClock.openSettings}
          />
        ) : (
          <>
            <PermissionNotice section="attendance" message="View only — you can’t edit the roll call." />
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
          </>
        )}
      </ScrollView>

      <EmployeeReportSheet
        visible={reportMember !== null}
        member={reportMember}
        onClose={() => setReportMember(null)}
        onExport={handleExportReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 16 },
});
