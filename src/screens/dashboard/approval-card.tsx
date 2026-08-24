import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { ApprovalItem } from '@/data/approvals/types';

export interface ApprovalCardProps {
  item: ApprovalItem;
  index: number;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalCard({ item, index, onApprove, onReject }: ApprovalCardProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).duration(240)}
      exiting={FadeOutUp.duration(200)}
      layout={LinearTransition.duration(200)}
    >
      <Card elevation="raised" style={styles.card}>
        <View style={styles.topRow}>
          <Avatar initials={item.initials} tint="mint" />
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.meta, tabularNums, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.meta}
            </Text>
          </View>
          <Text style={[styles.amount, tabularNums, { color: theme.textPrimary }]}>{item.amount}</Text>
        </View>
        <View style={styles.actions}>
          <View style={styles.grow}>
            <Button label="Approve" onPress={onApprove} />
          </View>
          <View style={styles.grow}>
            <Button label="Reject" variant="dangerOutline" onPress={onReject} />
          </View>
          <Pressable style={[styles.moreButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Icon name="more-horizontal" size={18} color={theme.textPrimary} />
          </Pressable>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  textWrap: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  amount: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
