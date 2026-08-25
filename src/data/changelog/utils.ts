import type { Theme } from '@/theme';

import { RELEASES, TYPE_ORDER } from './mock';
import type { ChangeType, FilterChipData, FilterKey, FlatEntry, Release, ReleaseGroup } from './types';

/** No shared theme token is this dimmed — literal per Admin Panel's HIDDEN_CHIP_FG precedent (the six engineering-only tags share one neutral tag, but the source script's dot for it is dimmer than `draftDot`). */
const TECH_DOT = { light: '#A3AFA9', dark: 'rgba(126,149,138,0.7)' };

export function flattenEntries(releases: Release[]): FlatEntry[] {
  const out: FlatEntry[] = [];
  releases.forEach((release) => {
    release.entries.forEach((entry, i) => {
      out.push({ ...entry, key: `${release.version}-${i}`, release });
    });
  });
  return out;
}

export function buildFilters(pool: FlatEntry[], active: FilterKey): FilterChipData[] {
  const counts: Partial<Record<ChangeType, number>> = {};
  pool.forEach((e) => {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  });

  const chips: FilterChipData[] = [{ key: 'All', label: 'All', count: pool.length }];
  TYPE_ORDER.forEach((t) => {
    const count = counts[t];
    if (count) chips.push({ key: t, label: t, count });
  });
  return chips;
}

/** Groups are always by release (the source's `groupBy: 'Month'` variant is a design-tool-only preview knob, dropped per the Phase 5 convention). */
export function groupByRelease(entries: FlatEntry[]): ReleaseGroup[] {
  const groups: ReleaseGroup[] = [];
  entries.forEach((e) => {
    let group = groups.find((g) => g.title === e.release.version);
    if (!group) {
      group = { title: e.release.version, meta: `${e.release.date} · ${e.release.note}`, entries: [] };
      groups.push(group);
    }
    group.entries.push(e);
  });
  return groups;
}

export function latestTally(release: Release) {
  const tally = { Feature: 0, Fix: 0, other: 0 };
  release.entries.forEach((e) => {
    if (e.type === 'Feature') tally.Feature++;
    else if (e.type === 'Fix') tally.Fix++;
    else tally.other++;
  });
  return tally;
}

export function totalChangeCount(): number {
  return RELEASES.reduce((n, r) => n + r.entries.length, 0);
}

export interface TypePalette {
  bg: string;
  fg: string;
  dot: string;
}

/** Feature/Fix/Performance/Update map exactly onto existing wash tokens (mirrors `StatusPill`'s on-track/blocked/at-risk/draft dot choices); Revert is the one deliberately dark/inverted tag; the six engineering-only types share one neutral tag with a dot dimmer than any existing token. */
export function typePalette(theme: Theme, type: ChangeType): TypePalette {
  switch (type) {
    case 'Feature':
      return { bg: theme.accentWash, fg: theme.accentWashText, dot: theme.scheme === 'light' ? '#22A97A' : theme.accent };
    case 'Fix':
      return { bg: theme.dangerWash, fg: theme.dangerWashText, dot: theme.scheme === 'light' ? theme.danger : theme.dangerWashText };
    case 'Performance':
      return { bg: theme.warningWash, fg: theme.warningWashText, dot: theme.warningWashText };
    case 'Update':
      return { bg: theme.draftWash, fg: theme.draftWashText, dot: theme.draftDot };
    case 'Revert':
      return { bg: theme.surfaceInverted, fg: theme.onDark.avatarText, dot: theme.surfaceInverted };
    default:
      return { bg: theme.draftWash, fg: theme.draftWashText, dot: TECH_DOT[theme.scheme] };
  }
}
