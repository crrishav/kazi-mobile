import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Employee } from '@/data/employees-hr/types';

export interface OrgChartViewProps {
  employees: Employee[];
  onOpenPerson: (id: number) => void;
}

interface Node {
  person: Employee;
  depth: number;
  reports: number;
}

/** Flatten the reportsTo tree into an indented list (item 28). */
function flatten(employees: Employee[]): Node[] {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const childrenOf = (id: number | undefined) =>
    employees
      .filter((e) => e.reportsTo === id)
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  // Roots = no manager, or a manager that isn't in the list.
  const roots = employees
    .filter((e) => e.reportsTo == null || !byId.has(e.reportsTo))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));

  const out: Node[] = [];
  const walk = (person: Employee, depth: number) => {
    const kids = childrenOf(person.id);
    out.push({ person, depth, reports: kids.length });
    kids.forEach((k) => walk(k, depth + 1));
  };
  roots.forEach((r) => walk(r, 0));
  return out;
}

export function OrgChartView({ employees, onOpenPerson }: OrgChartViewProps) {
  const theme = useTheme();
  const nodes = flatten(employees);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>
        {employees.length} on roll · reporting lines below
      </Text>
      {nodes.map(({ person, depth, reports }, i) => (
        <Animated.View key={person.id} entering={FadeInUp.delay(Math.min(i, 8) * 24).duration(200)} style={{ paddingLeft: depth * 18 }}>
          <View style={styles.rowWrap}>
            {depth > 0 ? <View style={[styles.elbow, { borderColor: theme.border }]} /> : null}
            <Pressable
              onPress={() => onOpenPerson(person.id)}
              style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card, opacity: person.active ? 1 : 0.55 }]}
            >
              <Avatar initials={person.avatarInitials} tint={person.avatarTint} size="md" />
              <View style={styles.textWrap}>
                <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                  {person.name}
                </Text>
                <Text style={[styles.role, { color: theme.textSecondary }]} numberOfLines={1}>
                  {person.role} · {person.dept}
                </Text>
              </View>
              {reports > 0 ? (
                <View style={[styles.badge, { backgroundColor: theme.draftWash }]}>
                  <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{reports}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  caption: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.08 * 10.5, textTransform: 'uppercase', paddingBottom: 4 },
  rowWrap: { flexDirection: 'row', alignItems: 'center' },
  elbow: { width: 12, height: 1, borderTopWidth: 1, marginRight: 4 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, padding: 12 },
  textWrap: { flex: 1, gap: 3, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 14 },
  role: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fontFamily.mono, fontSize: 11, fontWeight: '700' },
});
