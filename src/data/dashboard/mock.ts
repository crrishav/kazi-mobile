import type { DashboardSummary } from './types';

export const dashboardSummary: DashboardSummary = {
  userName: 'Sita',
  roleLine: 'Floor supervisor · Line 3',
  unreadNotifications: 4,
  activeOrdersTotal: 69,
  stages: [
    { id: 'received', label: 'Order received', count: 12 },
    { id: 'sourcing', label: 'Fabric sourcing', count: 8, blockedCount: 2 },
    { id: 'cutting', label: 'Cutting', count: 15 },
    { id: 'finishing', label: 'Finishing & pressing', count: 6 },
    { id: 'packing', label: 'Packing', count: 5 },
    { id: 'delivered', label: 'Delivered', count: 23 },
  ],
  attendance: { present: 213, late: 9, absent: 13, leave: 6 },
  attendanceOnRoll: 241,
  kpis: [
    {
      id: 'active-orders',
      label: 'Active orders',
      value: '69',
      delta: { arrow: 'up', tone: 'good', text: '5' },
      context: 'this week',
      sparkline: [6, 8, 7, 12, 11, 16, 15, 20],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      value: '88.4%',
      delta: { arrow: 'down', tone: 'warning', text: '2.1pt' },
      context: 'vs. avg',
      sparkline: [17, 18, 15, 16, 12, 13, 10, 11],
    },
    {
      id: 'below-reorder',
      label: 'Below reorder',
      value: '14',
      delta: { arrow: 'up', tone: 'bad', text: '3' },
      context: 'SKUs',
      sparkline: [8, 9, 12, 11, 15, 14, 18, 21],
    },
  ],
  updatedAgo: 'just now',
};

// Stage bar color ramp — a one-off progression (light mint -> ink) used only
// here, so it isn't promoted into the shared theme.
export const stageRampLight = ['#CDEDDD', '#A5E0C4', '#5FD2A0', '#2FA97C', '#147A57', '#0D1F19'];
export const stageRampDark = ['#1D3129', '#25453A', '#2FA97C', '#3FC190', '#57D19E', '#6FDDA9'];
