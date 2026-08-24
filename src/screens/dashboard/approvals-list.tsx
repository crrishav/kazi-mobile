import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { ApprovalItem } from '@/data/approvals/types';

import { ApprovalCard } from './approval-card';

export interface ApprovalsListProps {
  items: ApprovalItem[];
  onApprove: (item: ApprovalItem, index: number) => void;
  onReject: (item: ApprovalItem, index: number) => void;
}

export function ApprovalsList({ items, onApprove, onReject }: ApprovalsListProps) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Needs your approval</Text>
        <Text style={[styles.count, tabularNums, { color: theme.textSecondary }]}>{items.length} pending</Text>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="check" title="Queue clear" message="Nothing waiting on you right now." />
      ) : (
        items.map((item, index) => (
          <ApprovalCard
            key={item.id}
            item={item}
            index={index}
            onApprove={() => onApprove(item, index)}
            onReject={() => onReject(item, index)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  count: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
});
