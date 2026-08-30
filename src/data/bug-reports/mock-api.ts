import { simulateLatency } from '../mock/delay';
import { nextBugRef, seedBugReports } from './mock';
import type { BugReport, BugReportDraft, BugStatus } from './types';

let db: BugReport[] = [...seedBugReports];

export async function fetchBugReports(): Promise<BugReport[]> {
  await simulateLatency();
  return [...db];
}

export async function addBugReport(draft: BugReportDraft, reportedBy: string): Promise<BugReport> {
  await simulateLatency(300);
  const report: BugReport = {
    id: `b${Date.now()}`,
    ref: nextBugRef(db),
    title: draft.title.trim() || 'Untitled report',
    area: draft.area,
    severity: draft.severity,
    steps: draft.steps.trim(),
    status: 'open',
    reportedBy,
    createdAt: new Date().toISOString(),
    screenshot: draft.screenshot,
  };
  db = [report, ...db];
  return report;
}

export async function updateBugStatus(id: string, status: BugStatus): Promise<void> {
  await simulateLatency(200);
  db = db.map((r) => (r.id === id ? { ...r, status } : r));
}

/** Snapshot restore — the established undo path for status changes. */
export async function restoreBugReports(previous: BugReport[]): Promise<void> {
  await simulateLatency(150);
  db = [...previous];
}
