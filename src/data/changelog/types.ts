export type ChangeType = 'Feature' | 'Fix' | 'Performance' | 'Update' | 'Revert' | 'Refactor' | 'Chore' | 'Docs' | 'Style' | 'Test' | 'Build';

export type ReleaseState = 'Rolling out' | 'Live';

export interface ChangeEntry {
  type: ChangeType;
  date: string;
  title: string;
  detail: string;
  area: string;
  build: string;
  who: string;
  body: string;
  /** '' when a release note has no impact callout. */
  impact: string;
  /** The screen a "Open <screen>" jump would land on. */
  screen: string;
}

export interface Release {
  version: string;
  date: string;
  state: ReleaseState;
  note: string;
  entries: ChangeEntry[];
}

/** A flattened entry carrying a stable key and its parent release, for filtering and the detail sheet. */
export interface FlatEntry extends ChangeEntry {
  key: string;
  release: Release;
}

export type FilterKey = 'All' | ChangeType;

export interface FilterChipData {
  key: FilterKey;
  label: string;
  count: number;
}

export interface ReleaseGroup {
  title: string;
  meta: string;
  entries: FlatEntry[];
}
