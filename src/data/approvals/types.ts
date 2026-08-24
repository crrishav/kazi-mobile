export interface ApprovalItem {
  id: string;
  initials: string;
  title: string;
  /** Mono-font supporting line, e.g. "42 staff · 3h · tonight" — pre-formatted like the design. */
  meta: string;
  /** Pre-formatted amount — the design mixes currency, quantity and duration in one field (e.g. "NPR 68,400", "1,200 m", "3 days"). */
  amount: string;
}

export type ApprovalDecision = 'approve' | 'reject';
