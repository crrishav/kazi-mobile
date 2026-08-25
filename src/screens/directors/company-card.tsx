import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { COMPANY_INFO } from '@/data/directors/mock';

export function CompanyCard() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceInverted }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconSquare, { backgroundColor: '#16281F' }]}>
          <View style={[styles.iconDot, { backgroundColor: theme.onDark.accent }]} />
        </View>
        <Text style={[styles.eyebrow, { color: theme.onDark.textMuted }]}>About Kazi Manufacturing</Text>
      </View>

      <Text style={[styles.description, { color: theme.onDark.text }]}>{COMPANY_INFO.description}</Text>

      <View style={[styles.divider, { backgroundColor: 'rgba(233,241,236,0.14)' }]} />

      <View style={styles.statsGrid}>
        <View style={styles.gap5}>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Founded</Text>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.text }]}>{COMPANY_INFO.founded}</Text>
        </View>
        <View style={styles.gap5}>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>On roll</Text>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.text }]}>{COMPANY_INFO.onRoll}</Text>
        </View>
        <View style={styles.gap5}>
          <Text style={[styles.statLabel, { color: theme.onDark.textMuted }]}>Pcs / month</Text>
          <Text style={[styles.statValue, tabularNums, { color: theme.onDark.text }]}>{COMPANY_INFO.pcsPerMonth}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, gap: 13 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconSquare: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconDot: { width: 9, height: 9, borderRadius: 3 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  description: { fontSize: 14, lineHeight: 14 * 1.55 },
  divider: { height: 1 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  gap5: { gap: 5, flex: 1 },
  statLabel: { fontFamily: fontFamily.mono, fontSize: 9.5, letterSpacing: 0.1 * 9.5, textTransform: 'uppercase' },
  statValue: { fontSize: 17, fontWeight: '600', letterSpacing: -0.02 * 17 },
});
