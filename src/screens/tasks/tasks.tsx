import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { STATUS_LABEL, STATUS_ORDER } from '@/data/tasks/mock';
import { useDeleteTask, useSaveTask, useTasks, useUndoDeleteTask } from '@/data/tasks/hooks';
import type { Task, TaskStatus } from '@/data/tasks/types';

import { FilterChips, type TaskFilter } from './filter-chips';
import { TasksHeader } from './header';
import { TaskEditSheet } from './task-edit-sheet';
import { TaskProgressSheet } from './task-progress-sheet';
import { TaskRow } from './task-row';

function emptyDraft(): Task {
  return { id: `t${Date.now()}`, title: '', due: 'today', status: 'progress', assignee: '' };
}

export function Tasks() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canEdit = can('tasks');

  const { data: tasks } = useTasks();
  const saveTask = useSaveTask();
  const deleteTask = useDeleteTask();
  const undoDeleteTask = useUndoDeleteTask();

  const [filter, setFilter] = useState<TaskFilter>('all');
  const [query, setQuery] = useState('');
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [sheetMode, setSheetMode] = useState<'new' | 'edit' | null>(null);
  const [draft, setDraft] = useState<Task | null>(null);
  // Non-admins get the progress-only sheet instead of the full editor.
  const [progressTask, setProgressTask] = useState<Task | null>(null);

  if (!tasks) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const q = query.trim().toLowerCase();
  const matchesQuery = (t: Task) => !q || `${t.title} ${t.assignee}`.toLowerCase().includes(q);
  const matchesFilters = (t: Task, f: TaskFilter) =>
    (f === 'all' || t.status === f) && (!dueTodayOnly || t.due === 'today') && matchesQuery(t);
  const countFor = (f: TaskFilter) => tasks.filter((t) => matchesFilters(t, f)).length;
  const visible = tasks.filter((t) => matchesFilters(t, filter));
  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const dueTodayCount = tasks.filter((t) => t.due === 'today' && t.status !== 'done').length;

  const openNew = () => {
    setDraft(emptyDraft());
    setSheetMode('new');
  };
  // Admins open the full editor; everyone else gets progress-only.
  const openTask = (task: Task) => {
    if (!canEdit) {
      setProgressTask(task);
      return;
    }
    setDraft({ ...task });
    setSheetMode('edit');
  };
  const closeSheet = () => {
    setSheetMode(null);
    setDraft(null);
  };

  const handleSaveProgress = (status: TaskStatus) => {
    if (!progressTask) return;
    saveTask.mutate({ ...progressTask, status });
    setProgressTask(null);
  };
  const patchDraft = (patch: Partial<Task>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const handleSave = () => {
    if (!draft) return;
    const cleaned: Task = { ...draft, title: draft.title.trim() || 'Untitled task' };
    saveTask.mutate(cleaned);
    closeSheet();
  };

  const handleDelete = () => {
    if (!draft) return;
    const index = tasks.findIndex((t) => t.id === draft.id);
    const removed = draft;
    deleteTask.mutate(removed, {
      onSuccess: () => {
        toast.show({
          message: 'Task deleted',
          tone: 'bad',
          action: { label: 'Undo', onPress: () => undoDeleteTask.mutate({ task: removed, index }) },
        });
      },
    });
    closeSheet();
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <TasksHeader openCount={openCount} />

      <View style={styles.searchWrap}>
        <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border, boxShadow: theme.shadows.card }]}>
          <Icon name="search" size={17} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks or assignee"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={[styles.clearButton, { backgroundColor: theme.draftWash }]}>
              <Icon name="x" size={12} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.chipsWrap}>
        <FilterChips active={filter} onChange={setFilter} countFor={countFor} />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleLabelWrap}>
          <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Due today only</Text>
          <Text style={[styles.toggleCount, { color: theme.textSecondary }]}>{dueTodayCount}</Text>
        </View>
        <Switch value={dueTodayOnly} onValueChange={() => setDueTodayOnly((v) => !v)} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <PermissionNotice section="tasks" message="Tap a task to move its progress. Everything else is set by an admin." />
        {visible.length === 0 ? (
          <EmptyState
            icon="check"
            title="Nothing here"
            message={q ? `Nothing matches “${query.trim()}”. Clear the search or try another term.` : 'No tasks match this filter. Clear it or add a new task.'}
          />
        ) : (
          STATUS_ORDER.map((status) => {
            const group = visible.filter((t) => t.status === status);
            if (group.length === 0) return null;
            return (
              <View key={status} style={styles.group}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupDot, { backgroundColor: groupDotColor(theme, status) }]} />
                  <Text style={[styles.groupLabel, { color: theme.textPrimary }]}>{STATUS_LABEL[status]}</Text>
                  <Text style={[styles.groupCount, { color: theme.textSecondary }]}>{group.length}</Text>
                  <View style={[styles.groupLine, { backgroundColor: theme.border }]} />
                </View>
                {group.map((task, index) => (
                  <TaskRow key={task.id} task={task} index={index} onPress={() => openTask(task)} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {canEdit ? (
        <Pressable
          onPress={openNew}
          style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 12px 26px -12px rgba(20,122,87,0.95)' : undefined }]}
        >
          <Text style={[styles.fabPlus, { color: theme.accentText }]}>+</Text>
        </Pressable>
      ) : null}

      <TaskProgressSheet
        visible={progressTask !== null}
        task={progressTask}
        saving={saveTask.isPending}
        onClose={() => setProgressTask(null)}
        onSave={handleSaveProgress}
      />

      <TaskEditSheet
        visible={sheetMode !== null}
        draft={draft}
        isNew={sheetMode === 'new'}
        onClose={closeSheet}
        onChange={patchDraft}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </View>
  );
}

function groupDotColor(theme: ReturnType<typeof useTheme>, status: Task['status']): string {
  return { blocked: theme.danger, progress: theme.accent, inactive: theme.draftDot, done: theme.onDark.accent }[status];
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    padding: 0,
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  toggleLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  toggleLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  toggleCount: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 18,
  },
  group: {
    gap: 9,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  groupLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.14 * 10,
    textTransform: 'uppercase',
  },
  groupCount: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
  },
  groupLine: {
    flex: 1,
    height: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    fontSize: 26,
    fontWeight: '500',
    marginTop: -2,
  },
});
