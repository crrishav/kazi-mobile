import type { Message, Person, ThreadId, ThreadMeta } from './types';

export const PEOPLE: Record<ThreadId, Person> = {
  ak: { id: 'ak', name: 'Anil Karki', role: 'Cutting lead', initials: 'AK', avatarTint: 'mint', online: true, status: 'On shift · Line 2' },
  pt: { id: 'pt', name: 'Pramila Thapa', role: 'QC', initials: 'PT', avatarTint: 'clay', online: true, status: 'On shift · QC bay' },
  rb: { id: 'rb', name: 'Rabin Bhandari', role: 'Stores', initials: 'RB', avatarTint: 'draft', online: false, status: 'Off shift · back 14:00' },
  mk: { id: 'mk', name: 'Manisha KC', role: 'Packing', initials: 'MK', avatarTint: 'amber', online: true, status: 'On shift · Packing' },
  dm: { id: 'dm', name: 'Line 3 leads', role: 'Group · 6', initials: 'L3', avatarTint: 'dark', online: true, status: '6 members · 4 on shift' },
  jw: { id: 'jw', name: 'David Mott', role: 'London', initials: 'DM', avatarTint: 'draft', online: false, status: 'Off shift · GMT+1' },
};

export const THREADS: ThreadMeta[] = [
  { id: 'ak', time: 'Just now', unread: 2 },
  { id: 'pt', time: 'Just now', unread: 1 },
  { id: 'rb', time: '08:20', unread: 0, missing: true, preview: 'Zip stock — checking the back shelf now', ref: 'THR-0418 · deleted 08:52' },
  { id: 'mk', time: '08:02', unread: 0 },
  { id: 'dm', time: '07:20', unread: 3 },
  { id: 'jw', time: 'Yesterday', unread: 0 },
];

/** No seed thread for 'rb' — it's the deleted/missing thread and never had messages loaded. */
export const SEED_MESSAGES: Partial<Record<ThreadId, Message[]>> = {
  ak: [
    { from: 'them', text: "Fabric for PO-2288 still hasn't cleared the gate. Should I start the chino run instead?", meta: '09:12' },
    { from: 'me', text: 'Yes — swap to chino, keep the hoodie table set up.', meta: '09:14 · Read' },
    { from: 'them', text: "Table's laid. Moving 6 cutters over now.", meta: 'Just now' },
  ],
  pt: [
    { from: 'them', text: 'AQL sample on the tee run failed twice — mostly seam slippage.', meta: '08:41' },
    { from: 'me', text: "Photograph them and log against QC-113. I'll look before lunch.", meta: '08:44 · Read' },
    { from: 'them', text: 'Photos are up. 11 units flagged.', meta: 'Just now' },
  ],
  mk: [
    { from: 'them', text: 'Trims count is short by 400 zips for the packing line.', meta: '07:58' },
    { from: 'me', text: "Rabin's checking stores. Pack what you can in the meantime.", meta: '08:02 · Read' },
  ],
  dm: [
    { from: 'them', text: 'Overtime sheet for tonight needs two more names.', meta: 'Yesterday 18:30' },
    { from: 'me', text: 'Add Sunita and Bikash. 42 staff total.', meta: 'Yesterday 18:35 · Read' },
    { from: 'them', text: "Done. Sheet's with HR.", meta: '07:20' },
  ],
  jw: [
    { from: 'them', text: 'Buyer wants the shipped figure by 17:00 London.', meta: 'Yesterday 09:10' },
    { from: 'me', text: '7,940 as of this morning. Sending the pack now.', meta: 'Yesterday 09:22 · Read' },
  ],
};

/** The signed-in user — hardcoded like every other module's "current user" until real auth lands. */
export const CURRENT_USER = { initials: 'SR' };
