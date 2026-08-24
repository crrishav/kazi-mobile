import type { AvatarTint } from '@/components/ui/avatar';

export type StageKey = 'received' | 'fabric' | 'cutting' | 'finishing' | 'packing' | 'delivered';
export type BatchStatus = 'active' | 'hold' | 'cancelled' | 'done';
export type DueOptionId = 'd29' | 'd05' | 'd12';

export interface Stage {
  key: StageKey;
  label: string;
}

export interface Person {
  id: string;
  initials: string;
  name: string;
  tint: AvatarTint;
}

export interface Photo {
  label: string;
  time: string;
}

export interface Note {
  id: string;
  who: string;
  body: string;
  time: string;
  photo: string | null;
}

export interface Batch {
  id: string;
  product: string;
  code: string;
  ref: string;
  qty: string;
  due: string;
  stage: StageKey;
  status: BatchStatus;
  person: string;
  day: number;
  photos: Photo[];
  notes: Note[];
}

export interface BatchDraft {
  product: string;
  qty: string;
  ref: string;
  stage: StageKey;
  due: DueOptionId;
  person: string;
  photo: boolean;
}

export type ProductionFilter = 'all' | 'fabric' | 'cutting' | 'finishing' | 'packing' | 'cancelled';
export type ProductionView = 'list' | 'calendar' | 'detail';
