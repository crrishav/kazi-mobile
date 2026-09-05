import type { AvatarTint } from '@/components/ui/avatar';

export type PersonId = string;
export type ThreadId = string;
export type MessageId = string;

/** The signed-in user's id inside chat data — hardcoded like every other module's "current user" until real auth lands. */
export const ME: PersonId = 'me';

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  initials: string;
  avatarTint: AvatarTint;
  online: boolean;
  status: string;
}

export interface Reaction {
  emoji: string;
  /** Everyone who reacted, so a chip can show a count and whether it's mine. */
  by: PersonId[];
}

export interface Message {
  id: MessageId;
  threadId: ThreadId;
  /** `ME` for the signed-in user; a `PEOPLE` key for everyone else. This is what identifies the sender in a group. */
  authorId: PersonId;
  text: string;
  /** Epoch ms. Every timestamp on screen is derived from this — nothing is stored pre-formatted. */
  at: number;
  replyTo?: MessageId;
  reactions: Reaction[];
  /** Own messages only — whether the other side has read it. */
  read?: boolean;
  deleted?: boolean;
}

export type ThreadKind = 'dm' | 'group';

export interface Thread {
  id: ThreadId;
  kind: ThreadKind;
  /** Everyone but the signed-in user. A dm has exactly one. */
  memberIds: PersonId[];
  /** Groups only — a dm takes its title from the other member. */
  name?: string;
  /** Groups only — a dm takes its tint from the other member. */
  avatarTint?: AvatarTint;
  pinned?: boolean;
  muted?: boolean;
  /** Set when the thread is created, so a brand-new empty conversation still sorts near the top. */
  createdAt?: number;
  /** A deleted/removed thread — still listed, but opening it lands on the not-found state instead of messages. */
  missing?: boolean;
  /** Only set for a missing thread, whose preview and stamp can't be derived from its (absent) messages. */
  preview?: string;
  previewTime?: string;
  ref?: string;
}

export type ChatView = 'list' | 'thread';

/** Offered on the long-press sheet; the first is what a double-tap-style quick react would use. */
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '✅', '🙏'] as const;
