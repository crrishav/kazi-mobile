import type { Batch, DueOptionId, Person, Stage } from './types';

export const STAGES: Stage[] = [
  { key: 'received', label: 'Order received' },
  { key: 'fabric', label: 'Fabric sourcing' },
  { key: 'cutting', label: 'Cutting' },
  { key: 'finishing', label: 'Finishing & pressing' },
  { key: 'packing', label: 'Packing' },
  { key: 'delivered', label: 'Delivered' },
];

// Same ramp as the dashboard's stage widget — the design's own rule is "six
// segments, one language" so a stage reads identically wherever it appears.
export const stageRampLight = ['#CDEDDD', '#A5E0C4', '#5FD2A0', '#2FA97C', '#147A57', '#0D1F19'];
export const stageRampDark = ['#1D3129', '#25453A', '#2FA97C', '#3FC190', '#57D19E', '#6FDDA9'];

export const STATUS_LABEL: Record<Batch['status'], string> = {
  active: 'Active',
  hold: 'On hold',
  cancelled: 'Cancelled',
  done: 'Delivered',
};

export const PEOPLE: Person[] = [
  { id: 'sr', initials: 'SR', name: 'Sita', tint: 'dark' },
  { id: 'ak', initials: 'AK', name: 'Anil', tint: 'mint' },
  { id: 'pt', initials: 'PT', name: 'Pramila', tint: 'clay' },
  { id: 'rb', initials: 'RB', name: 'Rabin', tint: 'draft' },
];

export const DUE_OPTIONS: { id: DueOptionId; label: string; day: number }[] = [
  { id: 'd29', label: '29 Aug', day: 29 },
  { id: 'd05', label: '5 Sep', day: 5 },
  { id: 'd12', label: '12 Sep', day: 12 },
];

export const seedBatches: Batch[] = [
  {
    id: 'b1', product: 'Terry fabric hoodies', code: 'BATCH-118', ref: 'PO-2291', qty: '2,400 pcs', due: '29 Aug',
    stage: 'cutting', status: 'active', person: 'sr', day: 29,
    photos: [{ label: 'Cut panels · table 4', time: '08:40' }, { label: 'Fabric roll check', time: 'Mon 07:55' }],
    notes: [
      { id: 'n1', who: 'ak', body: 'Roll 12 has a 40cm shade variation near the selvedge — flagged to sourcing, cutting around it for now.', time: 'Mon 09:12', photo: 'Shade variation · roll 12' },
      { id: 'n2', who: 'sr', body: 'Approved to proceed. Buyer notified, no impact on ship date.', time: 'Mon 10:04', photo: null },
    ],
  },
  {
    id: 'b2', product: 'Chinese terry fabric', code: 'BATCH-117', ref: 'PO-2288', qty: '1,200 m', due: '27 Aug',
    stage: 'fabric', status: 'hold', person: 'ak', day: 27,
    photos: [{ label: 'Supplier sample', time: 'Fri 16:20' }],
    notes: [{ id: 'n1', who: 'ak', body: 'Everest Mills short by 300m. Substitution proposal with director — awaiting approval.', time: '2h ago', photo: null }],
  },
  {
    id: 'b3', product: 'Organic cotton tees', code: 'BATCH-116', ref: 'PO-2284', qty: '5,000 pcs', due: '31 Aug',
    stage: 'finishing', status: 'active', person: 'pt', day: 31,
    photos: [{ label: 'Press line output', time: '07:30' }],
    notes: [{ id: 'n1', who: 'pt', body: 'Pressing at 148°C, seam pucker within tolerance on first 200.', time: '07:34', photo: 'Seam check · first 200' }],
  },
  {
    id: 'b4', product: 'Merino base layers', code: 'BATCH-115', ref: 'PO-2279', qty: '900 pcs', due: '26 Aug',
    stage: 'packing', status: 'active', person: 'rb', day: 26,
    photos: [],
    notes: [{ id: 'n1', who: 'rb', body: 'Cartons labelled for UK freight, awaiting final AQL sign-off.', time: 'Yesterday 17:10', photo: null }],
  },
  {
    id: 'b5', product: 'Fleece joggers', code: 'BATCH-114', ref: 'PO-2276', qty: '1,800 pcs', due: '22 Aug',
    stage: 'delivered', status: 'done', person: 'sr', day: 22,
    photos: [{ label: 'Loaded container', time: '22 Aug 11:02' }],
    notes: [{ id: 'n1', who: 'sr', body: 'Handed to freight forwarder, POD received.', time: '22 Aug', photo: null }],
  },
  {
    id: 'b6', product: 'Denim overshirts', code: 'BATCH-113', ref: 'PO-2270', qty: '600 pcs', due: '—',
    stage: 'cutting', status: 'cancelled', person: 'pt', day: 0,
    photos: [],
    notes: [{ id: 'n1', who: 'pt', body: 'Buyer withdrew order before cutting completed. Fabric returned to store.', time: '19 Aug', photo: null }],
  },
];
