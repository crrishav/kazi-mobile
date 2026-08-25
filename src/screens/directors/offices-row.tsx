import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { OFFICES } from '@/data/directors/mock';

export function OfficesRow() {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {OFFICES.map((o) => (
        <View key={o.city} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cityRow}>
            <View style={[styles.dot, { backgroundColor: o.dotTone === 'accent' ? theme.accent : theme.warning }]} />
            <Text style={[styles.city, { color: theme.textPrimary }]} numberOfLines={1}>
              {o.city}
            </Text>
          </View>
          <Text style={[styles.lines, { color: theme.textSecondary }]}>{o.lines.join('\n')}</Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>{o.role}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 9 },
  card: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, gap: 7, minWidth: 0 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 99 },
  city: { fontFamily: fontFamily.semibold, fontSize: 14 },
  lines: { fontFamily: fontFamily.mono, fontSize: 10.5, lineHeight: 10.5 * 1.65 },
  role: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase', opacity: 0.85 },
});
