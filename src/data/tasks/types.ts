import type { AvatarTint } from '@/components/ui/avatar';

export type TaskStatus = 'blocked' | 'progress' | 'inactive' | 'done';
export type DueOptionId = 'today' | 'tomorrow' | 'week';

export interface Person {
  id: string;
  initials: string;
  name: string;
  tint: AvatarTint;
}

export interface Task {
  id: string;
  title: string;
  ref: string;
  due: DueOptionId;
  status: TaskStatus;
  personId: string;
}
