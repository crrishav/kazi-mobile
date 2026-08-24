import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { EmployeeView } from '@/data/employees-hr/types';

export interface TabsHeaderProps {
  view: EmployeeView;
  onChange: (v: EmployeeView) => void;
}

export function TabsHeader({ view, onChange }: TabsHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.outer}>
      <View style={[styles.segmented, { backgroundColor: theme.draftWash }]}>
        <Pressable
          onPress={() => onChange('directory')}
          style={[styles.segmentButton, { backgroundColor: view === 'directory' ? theme.surface : 'transparent', boxShadow: view === 'directory' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: view === 'directory' ? theme.textPrimary : theme.textSecondary }]}>Directory</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange('payroll')}
          style={[styles.segmentButton, styles.payrollButton, { backgroundColor: view === 'payroll' ? theme.surface : 'transparent', boxShadow: view === 'payroll' ? theme.shadows.card : undefined }]}
        >
          <Text style={[styles.segmentLabel, { color: view === 'payroll' ? theme.textPrimary : theme.textSecondary }]}>Payroll</Text>
          <Text style={[styles.adminBadge, { color: view === 'payroll' ? theme.textPrimary : theme.textSecondary }]}>ADMIN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 20, paddingBottom: 12 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4 },
  segmentButton: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  payrollButton: { flexDirection: 'row', gap: 7 },
  segmentLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  adminBadge: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.08 * 10, opacity: 0.7 },
});
