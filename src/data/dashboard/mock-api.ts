import { simulateLatency } from '../mock/delay';
import { dashboardSummary } from './mock';
import type { DashboardSummary } from './types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  await simulateLatency();
  return dashboardSummary;
}
