import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { PEOPLE } from '@/data/production/mock';
import type { Batch } from '@/data/production/types';

export interface DetailActivityProps {
  batch: Batch;
  noteDraft: string;
  onNoteDraft: (text: string) => void;
  onAddNote: () => void;
  onAddPhoto: () => void;
}

export function DetailActivity({ batch, noteDraft, onNoteDraft, onAddNote, onAddPhoto }: DetailActivityProps) {
  const theme = useTheme();

  return (
    <>
      <Card elevation="raised" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Photos</Text>
          <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>
            {batch.photos.length} {batch.photos.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          <Pressable onPress={onAddPhoto} style={[styles.addPhotoTile, { backgroundColor: theme.surface, borderColor: theme.accentDeep }]}>
            <Icon name="camera" size={22} color={theme.accentDeep} />
            <Text style={[styles.addPhotoLabel, { color: theme.accentDeep }]}>Camera{'\n'}or upload</Text>
          </Pressable>
          {batch.photos.map((p, i) => (
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
      </Card>

      <Card elevation="raised" style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Notes</Text>
          <Text style={[styles.sectionMeta, tabularNums, { color: theme.textSecondary }]}>{batch.notes.length} entries</Text>
        </View>
        <View style={styles.notesList}>
          {batch.notes.map((n) => {
            const person = n.who === 'system' ? { initials: 'KZ', name: 'System', tint: 'draft' as const } : PEOPLE.find((p) => p.id === n.who) ?? PEOPLE[0];
            return (
              <Animated.View key={n.id} entering={FadeInUp.duration(200)} style={styles.noteRow}>
                <View style={[styles.noteAvatar, noteAvatarTint(theme, person.tint)]}>
                  <Text style={[styles.noteAvatarText, noteAvatarTextTint(theme, person.tint)]}>{person.initials}</Text>
                </View>
                <View style={styles.noteTextWrap}>
                  <View style={styles.noteHeader}>
                    <Text style={[styles.noteName, { color: n.who === 'system' ? theme.textSecondary : theme.textPrimary }]}>{person.name}</Text>
                    <Text style={[styles.noteTime, tabularNums, { color: theme.textSecondary }]}>{n.time}</Text>
                  </View>
                  <Text style={[styles.noteBody, { color: theme.textPrimary }]}>{n.body}</Text>
                  {n.photo ? (
                    <View style={[styles.notePhoto, { borderColor: theme.border, backgroundColor: theme.draftWash }]}>
                      <View style={[styles.notePhotoCaption, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                        <Text style={[styles.notePhotoLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                          {n.photo}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            );
          })}
        </View>
        <View style={styles.composer}>
          <TextInput
            value={noteDraft}
            onChangeText={onNoteDraft}
            onSubmitEditing={onAddNote}
            placeholder="Add a note…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.composerInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
          />
          <Pressable onPress={onAddPhoto} style={[styles.composerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Icon name="camera" size={19} color={theme.textPrimary} />
          </Pressable>
          <Pressable onPress={onAddNote} style={[styles.composerButton, { backgroundColor: theme.accent, borderWidth: 0 }]}>
            <Icon name="arrow-right" size={19} color={theme.accentText} />
          </Pressable>
        </View>
      </Card>
    </>
  );
}

function noteAvatarTint(theme: ReturnType<typeof useTheme>, tint: 'dark' | 'mint' | 'clay' | 'draft' | 'amber') {
  const map = {
    dark: theme.onDark.avatarBg,
    mint: theme.accentWash,
    clay: theme.dangerWash,
    draft: theme.draftWash,
    amber: theme.warningWash,
  };
  return { backgroundColor: map[tint] };
}

function noteAvatarTextTint(theme: ReturnType<typeof useTheme>, tint: 'dark' | 'mint' | 'clay' | 'draft' | 'amber') {
  const map = {
    dark: theme.onDark.avatarText,
    mint: theme.accentWashText,
    clay: theme.dangerWashText,
    draft: theme.draftWashText,
    amber: theme.warningWashText,
  };
  return { color: map[tint] };
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fontFamily.semibold, fontSize: 15 },
  sectionMeta: { fontFamily: fontFamily.mono, fontSize: 11 },
  photoRow: { gap: 10, paddingBottom: 2 },
  addPhotoTile: { width: 96, height: 118, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addPhotoLabel: { fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 11.5 * 1.3 },
  photoTile: { width: 96, height: 118, borderRadius: 14, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  photoCaption: { padding: 7, gap: 2, borderTopWidth: 1 },
  photoLabel: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.06 * 9, textTransform: 'uppercase' },
  photoTime: { fontFamily: fontFamily.mono, fontSize: 9 },
  notesList: { gap: 14 },
  noteRow: { flexDirection: 'row', gap: 11 },
  noteAvatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noteAvatarText: { fontFamily: fontFamily.semibold, fontSize: 12 },
  noteTextWrap: { flex: 1, gap: 6, minWidth: 0 },
  noteHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  noteName: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  noteTime: { fontSize: 10.5 },
  noteBody: { fontSize: 13.5, lineHeight: 13.5 * 1.5 },
  notePhoto: { width: 132, height: 88, borderRadius: 12, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  notePhotoCaption: { padding: 5, borderTopWidth: 1 },
  notePhotoLabel: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.06 * 9, textTransform: 'uppercase' },
  composer: { flexDirection: 'row', gap: 8, paddingTop: 2 },
  composerInput: { flex: 1, height: 46, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, fontSize: 14 },
  composerButton: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
