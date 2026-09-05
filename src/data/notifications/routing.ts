/**
 * Pure recipient routing — no firebase, no React. Given an event and the
 * recipient roster, decide who gets notified and with what urgency. This is the
 * piece that stays identical when the source modules move from mock to
 * Firestore; only the callers of `notify()` change.
 *
 * See the plan / FRONTEND_GAP_PLAN for the full event→recipient matrix.
 */

import { sectionCanEdit, sectionVisible, type Profile, type SectionId } from '@/auth/permissions';
import type { Role } from '@/auth/roles';

import type { NotifActor, NotifType, NotificationEvent, ResolvedRecipient, RosterMember } from './types';

type Predicate = (member: RosterMember, ev: NotificationEvent, roster: RosterMember[]) => boolean;

interface Rule {
  type: NotifType;
  reason: string;
  when: Predicate;
}

const TYPE_RANK: Record<NotifType, number> = { info: 0, mention: 1, action: 2 };

function asProfile(m: RosterMember): Profile {
  return { email: m.email, name: m.name, initials: '', role: m.role };
}

function samePerson(m: RosterMember, who: string | null | undefined): boolean {
  if (!who) return false;
  const w = who.trim().toLowerCase();
  if (!w) return false;
  return m.email.toLowerCase() === w || m.name.trim().toLowerCase() === w;
}

// ---- predicate builders -------------------------------------------------------

const ROLE = (...roles: Role[]): Predicate => (m) => roles.includes(m.role);
const VIEW = (section: SectionId): Predicate => (m) => sectionVisible(asProfile(m), section);
const EDIT = (section: SectionId): Predicate => (m) => sectionCanEdit(asProfile(m), section);
const APPROVER: Predicate = (m) => m.role === 'uk_admin' || m.role === 'super_admin';
const LOC = (loc: 'nepal' | 'uk'): Predicate => (m) => m.location === loc;
const EVERYONE: Predicate = () => true;

/** Roster member matches `payload[field]` by name or email. */
const ID = (field: string): Predicate => (m, ev) => samePerson(m, (ev.payload as Record<string, unknown>)?.[field] as string);

/** Roster member is the manager of `payload[field]`. */
const MANAGER_OF = (field: string): Predicate => (m, ev, roster) => {
  const person = (ev.payload as Record<string, unknown>)?.[field] as string | undefined;
  if (!person) return false;
  const target = roster.find((r) => samePerson(r, person));
  return !!target?.managerName && target.managerName.trim().toLowerCase() === m.name.trim().toLowerCase();
};

/** Roster member appears in the string[] at `payload[field]`. */
const IN_LIST = (field: string): Predicate => (m, ev) => {
  const list = (ev.payload as Record<string, unknown>)?.[field];
  return Array.isArray(list) && list.some((n) => samePerson(m, String(n)));
};

const and = (...ps: Predicate[]): Predicate => (m, ev, r) => ps.every((p) => p(m, ev, r));
const or = (...ps: Predicate[]): Predicate => (m, ev, r) => ps.some((p) => p(m, ev, r));

// ---- the matrix -------------------------------------------------------------

const RULES: Record<string, Rule[]> = {
  // Tasks
  'task.assigned': [{ type: 'action', reason: 'This task was assigned to you', when: ID('assignee') }],
  'task.reassigned': [
    { type: 'action', reason: 'This task was assigned to you', when: ID('assignee') },
    { type: 'info', reason: 'This task is no longer assigned to you', when: ID('prevAssignee') },
  ],
  'task.status_changed': [
    { type: 'info', reason: 'You created this task', when: ID('createdBy') },
    { type: 'info', reason: "You're assigned to this task", when: ID('assignee') },
  ],
  'task.note_added': [
    { type: 'info', reason: "You're assigned to this task", when: ID('assignee') },
    { type: 'info', reason: 'You created this task', when: ID('createdBy') },
    { type: 'mention', reason: 'You were mentioned', when: IN_LIST('mentions') },
  ],
  'task.due_soon': [{ type: 'action', reason: "You're assigned to this task", when: ID('assignee') }],
  'task.overdue': [
    { type: 'action', reason: "You're assigned to this task", when: ID('assignee') },
    { type: 'action', reason: 'You created this task', when: ID('createdBy') },
  ],

  // Marketing
  'marketing.entry_created': [
    { type: 'info', reason: 'You can view Marketing', when: VIEW('marketing') },
  ],
  'marketing.entry_updated': [
    { type: 'info', reason: 'You can view Marketing', when: VIEW('marketing') },
    { type: 'info', reason: 'You created this entry', when: ID('createdBy') },
  ],
  'marketing.entry_deleted': [
    { type: 'info', reason: 'You can view Marketing', when: VIEW('marketing') },
    { type: 'info', reason: 'You created this entry', when: ID('createdBy') },
  ],
  'marketing.pending_approval': [{ type: 'action', reason: 'You approve marketing content', when: APPROVER }],
  'marketing.approved': [{ type: 'action', reason: 'You submitted this entry', when: ID('createdBy') }],
  'marketing.rejected': [{ type: 'action', reason: 'You submitted this entry', when: ID('createdBy') }],

  // Production
  'production.batch_created': [
    { type: 'info', reason: 'You work in Production', when: and(VIEW('production'), LOC('nepal')) },
  ],
  'production.output_logged': [
    { type: 'info', reason: 'You work in Production', when: and(VIEW('production'), LOC('nepal')) },
  ],
  'production.batch_blocked': [
    { type: 'action', reason: 'You manage Nepal operations', when: ROLE('nepal_admin', 'super_admin') },
    { type: 'action', reason: "You're on this production stage", when: IN_LIST('workerNames') },
  ],
  'production.stage_advanced': [
    { type: 'info', reason: "You're assigned to this order", when: ID('assignee') },
    { type: 'info', reason: 'You created this order', when: ID('createdBy') },
  ],


  // Orders / Sales
  'order.created': [
    { type: 'info', reason: 'You can view Order Management', when: VIEW('order-management') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'order.assigned': [{ type: 'action', reason: 'This order was assigned to you', when: ID('assignee') }],
  'order.priority_raised': [
    { type: 'action', reason: "You're assigned to this order", when: ID('assignee') },
    { type: 'action', reason: 'You manage operations', when: ROLE('nepal_admin', 'super_admin') },
  ],
  'order.stage_changed': [
    { type: 'info', reason: "You're assigned to this order", when: ID('assignee') },
    { type: 'info', reason: 'You created this order', when: ID('createdBy') },
  ],
  'order.dispatched': [
    { type: 'info', reason: 'You created this order', when: ID('createdBy') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
    { type: 'info', reason: 'You handle Billing', when: VIEW('billing') },
  ],
  'order.cancelled': [
    { type: 'action', reason: "You're assigned to this order", when: ID('assignee') },
    { type: 'action', reason: 'You created this order', when: ID('createdBy') },
    { type: 'action', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
    { type: 'action', reason: 'You handle Finance', when: VIEW('finance') },
  ],

  // Billing
  'invoice.created': [
    { type: 'info', reason: 'You handle Billing', when: VIEW('billing') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'invoice.sent': [
    { type: 'info', reason: 'You handle Billing', when: VIEW('billing') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'invoice.paid': [
    { type: 'info', reason: 'You created this invoice', when: ID('createdBy') },
    { type: 'info', reason: 'You handle Finance', when: VIEW('finance') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'invoice.overdue': [
    { type: 'action', reason: 'You handle Billing', when: VIEW('billing') },
    { type: 'action', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'invoice.cancelled': [
    { type: 'action', reason: 'You handle Billing', when: VIEW('billing') },
    { type: 'action', reason: "You're a system admin", when: ROLE('super_admin') },
  ],

  // Finance / Accounting
  'expense.logged': [
    { type: 'info', reason: 'You handle Finance', when: VIEW('finance') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'purchase.logged': [
    { type: 'info', reason: 'You handle Finance', when: VIEW('finance') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'expense.marked_paid': [{ type: 'info', reason: 'You logged this expense', when: ID('loggedBy') }],
  'journal.posted': [
    { type: 'info', reason: 'You handle Accounting', when: EDIT('accounting') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'bank.tx_imported': [
    { type: 'info', reason: 'You handle Finance', when: VIEW('finance') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'finance.large_amount': [{ type: 'action', reason: 'You oversee large spend', when: ROLE('uk_admin', 'super_admin') }],

  // Budget & Requirements
  'budget_request.submitted': [
    { type: 'action', reason: 'You approve budget requests', when: APPROVER },
    { type: 'action', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'budget_request.approved': [{ type: 'action', reason: 'You submitted this request', when: ID('requestedBy') }],
  'budget_request.rejected': [{ type: 'action', reason: 'You submitted this request', when: ID('requestedBy') }],
  'requirement.added': [
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
    { type: 'info', reason: 'You handle Purchases', when: VIEW('purchases') },
  ],

  // Purchases
  'purchase_order.created': [
    { type: 'info', reason: 'You handle Finance', when: VIEW('finance') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'purchase.received': [
    { type: 'info', reason: 'You handle Inventory', when: VIEW('inventory') },
    { type: 'info', reason: 'You requested this', when: ID('requestedBy') },
  ],

  // Inventory
  'inventory.low_stock': [
    { type: 'action', reason: 'You handle Inventory in Nepal', when: and(VIEW('inventory'), LOC('nepal')) },
    { type: 'action', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
    { type: 'action', reason: 'You handle Purchases', when: VIEW('purchases') },
  ],
  'inventory.adjusted': [
    { type: 'info', reason: 'You can view Inventory', when: VIEW('inventory') },
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
  ],
  'inventory.item_added': [{ type: 'info', reason: 'You can view Inventory', when: VIEW('inventory') }],
  'inventory.library_changed': [{ type: 'info', reason: 'You can view Inventory', when: VIEW('inventory') }],

  // Attendance / HR
  'attendance.clock_in_flagged': [
    { type: 'action', reason: 'You manage Nepal operations', when: ROLE('nepal_admin', 'super_admin') },
    { type: 'action', reason: "You're their manager", when: MANAGER_OF('employee') },
  ],
  'attendance.absent_late': [{ type: 'info', reason: 'This is your attendance record', when: ID('employee') }],
  'payroll.run_finalised': [
    { type: 'info', reason: 'Your salary slip is ready', when: IN_LIST('people') },
    { type: 'info', reason: "You're a director", when: ROLE('uk_admin') },
  ],
  'payroll.needs_approval': [{ type: 'action', reason: 'You approve payroll runs', when: APPROVER }],
  'employee.added': [
    { type: 'info', reason: 'You handle Employees & HR', when: EDIT('employees-hr') },
    { type: 'info', reason: "You're a system admin", when: ROLE('super_admin') },
  ],
  'employee.deactivated': [
    { type: 'info', reason: 'You handle Employees & HR', when: EDIT('employees-hr') },
    { type: 'info', reason: "You're a system admin", when: ROLE('super_admin') },
  ],
  'employee.login_created': [
    { type: 'info', reason: 'Your app login was created', when: ID('employee') },
    { type: 'info', reason: 'You handle Employees & HR', when: EDIT('employees-hr') },
  ],

  // Chat — bypasses the section-visibility guard
  'message.received': [{ type: 'mention', reason: 'You are in this conversation', when: IN_LIST('participants') }],
  'message.mention': [{ type: 'mention', reason: 'You were mentioned', when: IN_LIST('mentions') }],

  // Admin Panel
  'permissions.changed': [
    { type: 'action', reason: 'Your access changed', when: IN_LIST('people') },
    { type: 'action', reason: "You're a system admin", when: ROLE('super_admin') },
  ],
  'stage_config.changed': [
    { type: 'info', reason: 'You manage Nepal operations', when: ROLE('nepal_admin') },
    { type: 'info', reason: "You're on an affected stage", when: IN_LIST('workerNames') },
  ],

  // Bug Report
  'bug_report.submitted': [{ type: 'action', reason: "You're a system admin", when: ROLE('super_admin') }],
  'bug_report.status_changed': [{ type: 'info', reason: 'You submitted this report', when: ID('submittedBy') }],

  // Dashboard approvals card
  'approval.decided': [{ type: 'action', reason: 'You raised this for approval', when: ID('requestedBy') }],
};

/** Event types whose recipients skip the "can you view this section" guard. */
function bypassesViewGuard(eventType: string, type: NotifType): boolean {
  return type === 'mention' || eventType.startsWith('message.');
}

export function knownEventType(eventType: string): boolean {
  return eventType in RULES;
}

/**
 * Resolve the recipients of one event. Applies the universal post-filters:
 * drop the actor, enforce section visibility (except mentions/messages),
 * dedupe by email, and let `action` beat `info` when a member matches both.
 */
export function recipientsFor(
  ev: NotificationEvent,
  roster: RosterMember[],
  actor: NotifActor | null,
): ResolvedRecipient[] {
  const rules = RULES[ev.eventType];
  if (!rules || rules.length === 0) return [];

  const out: ResolvedRecipient[] = [];
  const seen = new Set<string>();

  for (const member of roster) {
    if (seen.has(member.email.toLowerCase())) continue;
    if (actor && member.email.toLowerCase() === actor.email.toLowerCase()) continue;

    let best: { type: NotifType; reason: string } | null = null;
    for (const rule of rules) {
      if (!rule.when(member, ev, roster)) continue;
      if (!best || TYPE_RANK[rule.type] > TYPE_RANK[best.type]) {
        best = { type: rule.type, reason: rule.reason };
      }
    }
    if (!best) continue;

    if (!bypassesViewGuard(ev.eventType, best.type) && !sectionVisible(asProfile(member), ev.section)) {
      continue;
    }

    seen.add(member.email.toLowerCase());
    out.push({ member, type: best.type, matchedRule: best.reason });
  }

  return out;
}
