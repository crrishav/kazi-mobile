import { simulateLatency } from '../mock/delay';
import { DEFAULT_CLOCK_STATUS, TEAM } from './mock';
import type { ClockStatus, TeamMember } from './types';

let clock: ClockStatus = { ...DEFAULT_CLOCK_STATUS };

function nowLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function fetchClockStatus(): Promise<ClockStatus> {
  await simulateLatency();
  return { ...clock };
}

export async function toggleClock(elapsedSeconds: number): Promise<ClockStatus> {
  await simulateLatency(250);
  clock = clock.clockedIn
    ? { clockedIn: false, inTime: clock.inTime, outTime: nowLabel(), elapsedSeconds }
    : { clockedIn: true, inTime: nowLabel(), outTime: null, elapsedSeconds };
  return { ...clock };
}

export async function fetchTeam(): Promise<TeamMember[]> {
  await simulateLatency();
  return [...TEAM];
}
