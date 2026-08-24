import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { QcNote, QcPhoto } from '@/data/quality-control/types';

export interface EvidenceProps {
  photos: QcPhoto[];
  notes: QcNote[];
  noteDraft: string;
  onNoteDraft: (text: string) => void;
  onAddPhoto: () => void;
}

export function Evidence({ photos, notes, noteDraft, onNoteDraft, onAddPhoto }: EvidenceProps) {
  const theme = useTheme();

  return (
    <Card elevation="raised" style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Evidence</Text>
        <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
        <Pressable onPress={onAddPhoto} style={[styles.addTile, { backgroundColor: theme.surface, borderColor: theme.accentDeep }]}>
          <Icon name="camera" size={22} color={theme.accentDeep} />
          <Text style={[styles.addLabel, { color: theme.accentDeep }]}>Add photo</Text>
        </Pressable>
        {photos.map((p, i) => (
          <Animated.View key={i} entering={FadeInUp.duration(200)} style={[styles.photoTile, { borderColor: theme.border, backgroundColor: theme.draftWash }]}>
            <View style={[styles.photoCaption, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={[styles.photoLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                {p.label}
              </Text>
              <Text style={[styles.photoTime, tabularNums, { color: theme.textSecondary }]}>{p.time}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <TextInput
        value={noteDraft}
        onChangeText={onNoteDraft}
        placeholder="Inspection note…"
        placeholderTextColor={theme.textSecondary}
        style={[styles.noteInput, { backgroundColor: theme.surfaceRaised, borderColor: theme.border, color: theme.textPrimary }]}
      />

      {notes.map((n, i) => (
        <Animated.View key={i} entering={FadeInUp.duration(200)} style={styles.noteRow}>
          <View style={[styles.noteAvatar, { backgroundColor: theme.dangerWash }]}>
            <Text style={[styles.noteAvatarText, { color: theme.dangerWashText }]}>PT</Text>
          </View>
          <View style={styles.noteTextWrap}>
            <Text style={[styles.noteTime, tabularNums, { color: theme.textSecondary }]}>{n.time}</Text>
            <Text style={[styles.noteBody, { color: theme.textPrimary }]}>{n.body}</Text>
          </View>
        </Animated.View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  sectionMeta: { fontFamily: fontFamily.mono, fontSize: 11 },
  photoRow: { gap: 10, paddingBottom: 2 },
  addTile: { width: 92, height: 112, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addLabel: { fontSize: 11.5, fontWeight: '600' },
  photoTile: { width: 92, height: 112, borderRadius: 14, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  photoCaption: { padding: 7, gap: 2, borderTopWidth: 1 },
  photoLabel: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.06 * 9, textTransform: 'uppercase' },
  photoTime: { fontFamily: fontFamily.mono, fontSize: 9 },
  noteInput: { height: 48, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, fontSize: 14 },
  noteRow: { flexDirection: 'row', gap: 10 },
  noteAvatar: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noteAvatarText: { fontFamily: fontFamily.semibold, fontSize: 11 },
  noteTextWrap: { flex: 1, gap: 3, minWidth: 0 },
  noteTime: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  noteBody: { fontSize: 13.5, lineHeight: 13.5 * 1.5 },
});
