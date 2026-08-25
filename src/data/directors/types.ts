import type { AvatarTint } from '@/components/ui/avatar';

export type DirectorGroup = 'nepal' | 'admin' | 'uk';

export interface Director {
  id: number;
  name: string;
  role: string;
  group: DirectorGroup;
  office: string;
  tag: string;
  since: string;
  tenure: string;
  email: string;
  bio: string;
  remit: string[];
  avatarInitials: string;
  avatarTint: AvatarTint;
}

export interface DirectorGroupDef {
  key: DirectorGroup;
  title: string;
  meta: string;
}

export interface OfficeInfo {
  city: string;
  dotTone: 'accent' | 'warning';
  lines: string[];
  role: string;
}

export interface CompanyInfo {
  description: string;
  founded: string;
  onRoll: string;
  pcsPerMonth: string;
}
