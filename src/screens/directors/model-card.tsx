import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { MODEL_DESCRIPTION, MODEL_TAGS } from '@/data/directors/mock';

export function ModelCard() {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, boxShadow: theme.shadows.card }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Factory-direct model</Text>
        <View style={[styles.noAgentsPill, { backgroundColor: theme.accentWash }]}>
          <View style={[styles.pillDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.pillLabel, { color: theme.accentWashText }]}>No agents</Text>
        </View>
      </View>

      <View style={styles.diagramRow}>
        <View style={[styles.diagramPill, { backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.diagramLabel, { color: theme.textPrimary }]}>Mill</Text>
        </View>
        <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
        <View style={[styles.diagramPill, styles.diagramPillWide, { backgroundColor: theme.accent }]}>
          <Text style={[styles.diagramLabel, { color: theme.accentText }]}>Kazi plant</Text>
        </View>
        <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
        <View style={[styles.diagramPill, { backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border }]}>
          <Text style={[styles.diagramLabel, { color: theme.textPrimary }]}>Brand</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.textPrimary }]}>{MODEL_DESCRIPTION}</Text>

      <View style={styles.tagsRow}>
        {MODEL_TAGS.map((t) => (
          <View key={t} style={[styles.tag, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
            <Text style={[styles.tagLabel, { color: theme.textPrimary }]}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, gap: 13 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  noAgentsPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 9, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 11.5, fontWeight: '600' },
  diagramRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  diagramPill: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingVertical: 9, paddingHorizontal: 4 },
  diagramPillWide: { flex: 1.15 },
  diagramLabel: { fontSize: 12, fontWeight: '600', lineHeight: 12 * 1.2 },
  arrow: { fontSize: 11 },
  description: { fontSize: 13, lineHeight: 13 * 1.55 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag: { height: 28, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tagLabel: { fontSize: 12, fontWeight: '600' },
});
