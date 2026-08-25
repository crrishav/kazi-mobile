import type { AvatarTint } from '@/components/ui/avatar';

export type ThreadId = 'ak' | 'pt' | 'rb' | 'mk' | 'dm' | 'jw';

export interface Person {
  id: ThreadId;
  name: string;
  role: string;
  initials: string;
  avatarTint: AvatarTint;
  online: boolean;
  status: string;
}

export interface Message {
  from: 'me' | 'them';
  text: string;
  meta: string;
}

export interface ThreadMeta {
  id: ThreadId;
  time: string;
  unread: number;
  /** A deleted/removed thread — still listed, but opening it lands on the not-found state instead of messages. */
  missing?: boolean;
  /** Only set for a missing thread, whose preview can't be derived from its (absent) messages. */
  preview?: string;
  ref?: string;
}

export type PullState = 'idle' | 'loading' | 'done';

export type MessengerView = 'list' | 'thread';
