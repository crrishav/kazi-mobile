import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';

import { ErrorState } from './error-state';

/**
 * The slice of a React Query result this needs. Declared structurally so any
 * `UseQueryResult` satisfies it without a cast.
 */
export interface GateQuery {
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  error: unknown;
  /** Undefined until the query has ever succeeded. */
  data: unknown;
  refetch: () => unknown;
}

/**
 * A failure worth replacing the screen for.
 *
 * A query that errored but still holds data from an earlier success is not
 * one: React Query serves the cached rows and retries in the background, and
 * tearing a working screen down over a dropped refetch would be its own kind
 * of lying about the state of things. Only a failure with nothing behind it
 * leaves the screen with nothing honest to draw.
 */
function fatally(q: GateQuery): boolean {
  return q.isError && q.data === undefined;
}

/**
 * True while a screen has nothing worth rendering — still loading, or failed.
 *
 * Deliberately a plain function rather than a hook: several screens return
 * early above their gate, and a hook there would be a conditional hook.
 */
export function isBlocked(...queries: GateQuery[]): boolean {
  return queries.some((q) => fatally(q) || q.isPending);
}

/**
 * Failed, ignoring whether it is still loading.
 *
 * For a query a screen renders progressively around rather than waiting on:
 * its absence is fine and draws a local spinner, but its FAILURE still has to
 * stop the screen instead of leaving that spinner up for ever.
 */
export function hasFailed(...queries: GateQuery[]): boolean {
  return queries.some(fatally);
}

/**
 * What a data screen renders instead of its content.
 *
 * Screens used to open with `if (!data) return <ActivityIndicator/>`, which
 * worked only because a failed read quietly resolved to mock data — there was
 * no third outcome to draw. Now that a failed read throws, `data` stays
 * undefined on failure and that gate would spin forever, so loading and failure
 * have to be told apart:
 *
 *     const tasksQuery = useTasks();
 *     const { data: tasks } = tasksQuery;
 *     if (isBlocked(tasksQuery)) return <ScreenGate queries={[tasksQuery]} />;
 */
export function ScreenGate({ queries }: { queries: GateQuery[] }) {
  const theme = useTheme();

  const failed = queries.find(fatally);
  if (failed) {
    // Retry everything that broke, not just the one being shown — screens that
    // read from several modules usually lose them all to the same cause.
    const broken = queries.filter((q) => q.isError);
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <ErrorState
          error={failed.error}
          onRetry={() => broken.forEach((q) => q.refetch())}
          retrying={broken.some((q) => q.isFetching)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fill, styles.centre, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centre: {
    alignItems: 'center',
  },
});
