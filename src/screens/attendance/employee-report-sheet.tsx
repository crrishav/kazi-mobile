import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { MONTH_LABEL, STATUS_RAMP } from '@/data/attendance/mock';
import type { AttendanceStatus, TeamMember } from '@/data/attendance/types';

export interface EmployeeReportSheetProps {
  visible: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onExport: () => void;
}

const TALLIES: { key: AttendanceStatus; label: string }[] = [
  { key: 'present', label: 'Present' },
  { key: 'late', label: 'Late' },
  { key: 'absent', label: 'Absent' },
  { key: 'half', label: 'Half-day' },
  { key: 'leave', label: 'Leave' },
];

/** Per-staffer month report (item 27) — tallies + hours, with a CSV export. */
export function EmployeeReportSheet({ visible, member, onClose, onExport }: EmployeeReportSheetProps) {
  const theme = useTheme();
  const ramp = STATUS_RAMP[theme.scheme];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={member ? `${member.name} · ${MONTH_LABEL}` : 'Report'} maxHeight={560}>
      {member ? (
        <>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{member.role} · {member.month.hoursMTD} worked · {member.month.otHours} OT</Text>

          <View style={styles.grid}>
            {TALLIES.map((t) => (
              <View key={t.key} style={[styles.cell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.dot, { backgroundColor: ramp[t.key].dot }]} />
                <Text style={[styles.cellValue, tabularNums, { color: theme.textPrimary }]}>{member.month[t.key]}</Text>
                <Text style={[styles.cellLabel, { color: theme.textSecondary }]}>{t.label}</Text>
              </View>
            ))}
          </View>

          <Button label="Export report (CSV)" variant="secondary" onPress={onExport} fullWidth style={styles.export} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontFamily: fontFamily.mono, fontSize: 10.5, marginTop: -12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '30%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 99 },
  cellValue: { fontFamily: fontFamily.semibold, fontSize: 20 },
  cellLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  export: { height: 50, marginTop: 4 },
});
