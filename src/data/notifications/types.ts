import type { SectionId } from '@/auth/permissions';
import type { Role } from '@/auth/roles';

export type NotifType = 'info' | 'action' | 'mention';

/** A member of the recipient roster (from `employees` + `TEAM_MEMBERS`). */
export interface RosterMember {
  email: string;
  name: string;
  role: Role;
  location: 'nepal' | 'uk';
  /** Manager's name, from `employees.reportsTo` resolution — powers `MANAGER_OF`. */
  managerName?: string;
}

/** Who performed the action. Pulled from the module-level actor set by AuthProvider. */
export interface NotifActor {
  name: string;
  email: string;
  role: Role;
}

/**
 * The input a mutation hook hands to `notify()`. `payload` carries whatever the
 * routing rules for `eventType` need — assignee, createdBy, amount, status,
 * participants, mentions, etc. Everything is optional; rules read defensively.
 */
export interface NotificationEvent {
  eventType: string;
  section: SectionId;
  /** Business ref shown in the row + used in the dedupe/deep-link, e.g. `ORD-051`. */
  targetRef?: string | null;
  payload?: NotificationPayload;
}

export interface NotificationPayload {
  assignee?: string | null;
  prevAssignee?: string | null;
  createdBy?: string | null;
  loggedBy?: string | null;
  requestedBy?: string | null;
  submittedBy?: string | null;
  owner?: string | null;
  employee?: string | null;
  /** Affected people for `permissions.changed` / `payroll.run_finalised`. */
  people?: string[];
  /** Messenger thread participant names. */
  participants?: string[];
  /** `@name` handles parsed from free text. */
  mentions?: string[];
  /** Production stage worker names. */
  workerNames?: string[];
  status?: string | null;
  priority?: string | null;
  amountNPR?: number | null;
  /** Free-form extras merged into the rendered body / title. */
  label?: string | null;
  count?: number | null;
}

/** One resolved recipient of an event, after rules + post-filters. */
export interface ResolvedRecipient {
  member: RosterMember;
  type: NotifType;
  /** Human "why you got this", stored on the doc. */
  matchedRule: string;
}

/** The Firestore document written to `mobile_notifications`. */
export interface NotificationDoc {
  recipientEmail: string;
  recipientRole: Role;
  type: NotifType;
  eventType: string;
  section: SectionId;
  title: string;
  body: string;
  deepLink: string | null;
  actorName: string;
  actorEmail: string;
  targetRef: string | null;
  matchedRule: string;
  read: boolean;
  /** serverTimestamp() on write. */
  createdAt: unknown;
  source: 'kazi-mobile';
}

/** Client-side view of a notification (Firestore doc + id + normalised time). */
export interface NotificationRecord {
  id: string;
  recipientEmail: string;
  type: NotifType;
  eventType: string;
  section: SectionId;
  title: string;
  body: string;
  deepLink: string | null;
  actorName: string;
  targetRef: string | null;
  matchedRule: string;
  read: boolean;
  createdAtISO: string;
}
