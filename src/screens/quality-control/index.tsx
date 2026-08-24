import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useQueue, useRemoveFromQueue, useRestoreToQueue } from '@/data/quality-control/hooks';
import { POINTS } from '@/data/quality-control/mock';
import type { CheckVerdict, QcNote, QcPhoto, QcView, QueueItem } from '@/data/quality-control/types';

import { ChecklistPoint } from './checklist-point';
import { Evidence } from './evidence';
import { QueueCard } from './queue-card';
import { QueueSummary } from './queue-summary';
import { VerdictBar } from './verdict-bar';

const VERDICT_WORD: Record<CheckVerdict, string> = {
  pass: 'passed',
  flag: 'flagged for re-check',
  fail: 'failed · sent for rework',
};

export function QualityControl() {
  const theme = useTheme();
  const toast = useToast();

  const { data: queue } = useQueue();
  const removeFromQueue = useRemoveFromQueue();
  const restoreToQueue = useRestoreToQueue();

  const [cleared, setCleared] = useState(6);
  const [view, setView] = useState<QcView>('queue');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, CheckVerdict>>({});
  const [defects, setDefects] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<QcPhoto[]>([{ label: 'Shoulder seam', time: '10:18' }]);
  const [notes] = useState<QcNote[]>([{ time: '10:19', body: 'Sample pulled from carton 4 and carton 11 per AQL plan.' }]);
  const [noteDraft, setNoteDraft] = useState('');

  if (!queue) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const selected = queue.find((q) => q.id === selectedId) ?? null;

  const clear = (item: QueueItem, kind: CheckVerdict) => {
    const index = queue.findIndex((q) => q.id === item.id);
    removeFromQueue.mutate(item);
    setCleared((c) => c + 1);
    setView('queue');
    setSelectedId(null);
    toast.show({
      message: `${item.code} ${VERDICT_WORD[kind]}`,
      tone: kind === 'fail' ? 'bad' : kind === 'flag' ? 'warn' : 'ok',
      action: {
        label: 'Undo',
        onPress: () => {
          restoreToQueue.mutate({ item, index });
          setCleared((c) => Math.max(c - 1, 0));
        },
      },
    });
  };

  const open = (item: QueueItem) => {
    setView('detail');
    setSelectedId(item.id);
    setChecks({});
    setDefects({});
    setNoteDraft('');
  };

  const setVerdict = (pid: string, verdict: CheckVerdict) => {
    setChecks((c) => ({ ...c, [pid]: verdict }));
    if (verdict === 'fail') setDefects((d) => ({ ...d, [pid]: d[pid] || 1 }));
  };

  const bumpDefects = (pid: string, delta: number) => setDefects((d) => ({ ...d, [pid]: Math.max((d[pid] || 0) + delta, 0) }));

  const addPhoto = () => setPhotos((p) => [{ label: 'Floor capture', time: 'just now' }, ...p]);

  if (view === 'detail' && selected) {
    const checkedCount = POINTS.filter((p) => checks[p.id]).length;
    const fails = POINTS.filter((p) => checks[p.id] === 'fail');
    const flags = POINTS.filter((p) => checks[p.id] === 'flag');
    const totalDefects = POINTS.reduce((n, p) => n + (checks[p.id] === 'fail' ? defects[p.id] || 0 : 0), 0);
    const complete = checkedCount === POINTS.length;

    let verdictLabel = 'Complete the checklist';
    let verdictBg: string = theme.draftWash;
    let verdictFg: string = theme.draftWashText;
    if (complete && fails.length) {
      verdictLabel = 'Send for rework';
      verdictBg = theme.danger;
      verdictFg = theme.dangerText;
    } else if (complete) {
      verdictLabel = flags.length ? 'Pass with flags' : 'Pass batch';
      verdictBg = theme.accent;
      verdictFg = theme.accentText;
    }

    const verdictSummary = fails.length
      ? `${fails.length} failed · ${flags.length} flagged`
      : flags.length
        ? `${flags.length} flagged · rest passing`
        : complete
          ? 'All points passed'
          : `${POINTS.length - checkedCount} points left`;

    const submit = () => {
      if (complete) clear(selected, fails.length ? 'fail' : flags.length ? 'flag' : 'pass');
    };

    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader
          title={selected.product}
          subtitle={`${selected.code} · sample ${selected.sample}`}
          onBack={() => {
            setView('queue');
            setSelectedId(null);
          }}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.progressRow}>
            {POINTS.map((p) => {
              const v = checks[p.id];
              const color = v === 'pass' ? theme.accent : v === 'flag' ? theme.warning : v === 'fail' ? theme.danger : theme.border;
              return <View key={p.id} style={[styles.progressBar, { backgroundColor: color }]} />;
            })}
          </View>

          {POINTS.map((p, i) => (
            <ChecklistPoint
              key={p.id}
              point={p}
              index={i}
              verdict={checks[p.id]}
              defects={defects[p.id] || 0}
              onSetVerdict={(v) => setVerdict(p.id, v)}
              onBumpDefects={(d) => bumpDefects(p.id, d)}
            />
          ))}

          <Evidence photos={photos} notes={notes} noteDraft={noteDraft} onNoteDraft={setNoteDraft} onAddPhoto={addPhoto} />
        </ScrollView>

        <VerdictBar
          summary={verdictSummary}
          defectSummary={`${totalDefects} ${totalDefects === 1 ? 'defect' : 'defects'} · AQL 2.5 allows 7`}
          label={verdictLabel}
          background={verdictBg}
          foreground={verdictFg}
          onSubmit={submit}
          onSave={() => {
            setView('queue');
            setSelectedId(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Quality control"
        subtitle={`${queue.length} awaiting · ${cleared} cleared today`}
        rightSlot={<Avatar initials="PT" tint="dark" size="lg" />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <QueueSummary />
        {queue.length === 0 ? (
          <EmptyState icon="check-circle" title="Queue clear" message="Every batch waiting on QC has been reviewed. New ones arrive as lines finish." />
        ) : (
          queue.map((item, i) => (
            <QueueCard
              key={item.id}
              item={item}
              index={i}
              onOpen={() => open(item)}
              onPass={() => clear(item, 'pass')}
              onFlag={() => clear(item, 'flag')}
              onFail={() => clear(item, 'fail')}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  progressRow: { flexDirection: 'row', gap: 3 },
  progressBar: { flex: 1, height: 5, borderRadius: 99 },
});
