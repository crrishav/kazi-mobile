/**
 * `notify(event)` — the single call a mutation hook makes after a successful
 * write. Fire-and-forget: it never throws and never delays the mutation. It
 * resolves the recipient roster, runs the pure routing rules, and writes one
 * `mobile_notifications` doc per recipient. No-op when Firebase isn't
 * configured.
 */

import { queryClient } from '@/data/client';
import { isSupabaseConfigured as isFirebaseConfigured } from '@/lib/supabase';

import { getActor } from './actor';
import { describeEvent, deepLinkFor } from './events';
import { writeNotifications } from './firestore';
import { notificationKeys } from './keys';
import { recipientsFor } from './routing';
import { fetchRoster } from './roster';
import type { NotificationDoc, NotificationEvent } from './types';

export function notify(ev: NotificationEvent): void {
  if (!isFirebaseConfigured) return;
  void dispatch(ev).catch((err) => console.warn('[notifications] notify failed', err));
}

async function dispatch(ev: NotificationEvent): Promise<void> {
  const actor = getActor();

  const roster = await queryClient.ensureQueryData({
    queryKey: notificationKeys.roster(),
    queryFn: fetchRoster,
    staleTime: 10 * 60 * 1000,
  });

  const recipients = recipientsFor(ev, roster, actor);
  if (recipients.length === 0) return;

  const link = deepLinkFor(ev);
  const copy = describeEvent(ev, actor?.name ?? 'Someone');

  const docs: NotificationDoc[] = recipients.map((r) => ({
    recipientEmail: r.member.email.toLowerCase(),
    recipientRole: r.member.role,
    type: r.type,
    eventType: ev.eventType,
    section: ev.section,
    title: copy.title,
    body: copy.body,
    deepLink: link,
    actorName: actor?.name ?? 'Someone',
    actorEmail: (actor?.email ?? '').toLowerCase(),
    targetRef: ev.targetRef ?? null,
    matchedRule: r.matchedRule,
    read: false,
    createdAt: null,
    source: 'kazi-mobile',
  }));

  await writeNotifications(docs);
}
