import type { AvatarTint } from '@/components/ui/avatar';
import type { Customer, CustomerDraft, OrderStageId } from './types';

export const STAGE: Record<OrderStageId, { label: string; bg: string; fg: string; dot: string }> = {
  sourcing: { label: 'Sourcing', bg: '#F1EEE5', fg: '#3B4F47', dot: '#8C9A92' },
  cutting: { label: 'Cutting', bg: '#F7EEDA', fg: '#7A5709', dot: '#B98514' },
  finishing: { label: 'Finishing', bg: '#E9EFEC', fg: '#0E5E43', dot: '#147A57' },
  packing: { label: 'Packing', bg: '#E2F6EC', fg: '#0E5E43', dot: '#22A97A' },
};

export const TERMS = ['Prepaid', '30 days', '45 days', '60 days'];

/** Row avatars cycle through these tints by row position, matching the design's positional AVATARS cycling. */
export const AVATAR_TINTS: AvatarTint[] = ['mint', 'clay', 'amber', 'dark', 'draft'];

export const blankDraft: CustomerDraft = {
  type: 'company',
  name: '',
  contact: '',
  role: '',
  email: '',
  phone: '',
  city: '',
  country: 'UK',
  address: '',
  terms: '30 days',
};

export const seedCustomers: Customer[] = [
  {
    id: 'c1', type: 'company', name: 'Northfield Apparel', contact: 'Ellie Marsh', role: 'Buying manager', email: 'ellie@northfield.co.uk', phone: '+44 113 496 2210', city: 'Leeds', country: 'UK', address: 'Unit 7, Kirkstall Road, Leeds LS4 2AZ', terms: '30 days', since: 'Customer since 2022',
    orders: [{ product: 'Oversized hoodie · AW26', meta: 'SO-2291 · 2,400 pcs · ships 27 Aug', stage: 'cutting' }, { product: 'Zip-through hoodie', meta: 'SO-2296 · 1,500 pcs · ships 11 Sep', stage: 'sourcing' }],
    invoices: [{ ref: 'INV-1187', amount: 28400, due: 'due 04 Sep', status: 'open' }, { ref: 'INV-1162', amount: 19250, due: 'paid 12 Aug', status: 'paid' }, { ref: 'INV-1144', amount: 31100, due: 'paid 22 Jul', status: 'paid' }],
  },
  {
    id: 'c2', type: 'company', name: 'Halden & Co.', contact: 'Tom Ashby', role: 'Head of sourcing', email: 'tom.ashby@halden.co', phone: '+44 161 224 7788', city: 'Manchester', country: 'UK', address: '3 Ducie Street, Manchester M1 2JW', terms: '45 days', since: 'Customer since 2021',
    orders: [{ product: 'Organic cotton tee', meta: 'SO-2290 · 5,000 pcs · ships 25 Aug', stage: 'packing' }],
    invoices: [{ ref: 'INV-1191', amount: 41800, due: 'overdue 9 days', status: 'overdue' }, { ref: 'INV-1170', amount: 12600, due: 'due 18 Sep', status: 'open' }, { ref: 'INV-1131', amount: 27400, due: 'paid 30 Jun', status: 'paid' }],
  },
  {
    id: 'c3', type: 'company', name: 'Kew Lane Studio', contact: 'Priya Raman', role: 'Founder', email: 'priya@kewlane.london', phone: '+44 20 7946 0912', city: 'London', country: 'UK', address: '12 Kew Lane Mews, London W6 9BT', terms: 'Prepaid', since: 'Customer since 2024',
    orders: [{ product: 'Linen shirt · SS27', meta: 'SO-2294 · 800 pcs · ships 02 Sep', stage: 'finishing' }],
    invoices: [{ ref: 'INV-1188', amount: 9600, due: 'paid 19 Aug', status: 'paid' }, { ref: 'INV-1155', amount: 8200, due: 'paid 28 Jul', status: 'paid' }],
  },
  {
    id: 'c4', type: 'person', name: 'Anita Shrestha', contact: 'Anita Shrestha', role: 'Independent designer', email: 'anita.shrestha@studioaks.np', phone: '+977 1 442 9081', city: 'Kathmandu', country: 'NP', address: 'Jhamsikhel, Lalitpur 44700', terms: 'Cash', since: 'Customer since 2025',
    orders: [{ product: 'Cotton overshirt', meta: 'SO-2287 · 1,200 pcs · ships 26 Aug', stage: 'cutting' }],
    invoices: [{ ref: 'INV-1190', amount: 3400, due: 'due 29 Aug', status: 'open' }],
  },
  {
    id: 'c5', type: 'company', name: 'Base Layer Studio', contact: 'Jonas Vik', role: 'Ops lead', email: 'jonas@baselayer.no', phone: '+47 22 84 61 30', city: 'Oslo', country: 'NO', address: 'Torggata 14, 0181 Oslo', terms: 'Prepaid', since: 'Customer since 2023',
    orders: [{ product: 'Merino base layer', meta: 'SO-2289 · 900 pcs · ships 29 Aug', stage: 'finishing' }],
    invoices: [{ ref: 'INV-1186', amount: 22800, due: 'paid 15 Aug', status: 'paid' }],
  },
  {
    id: 'c6', type: 'person', name: 'Daniel Oyelaran', contact: 'Daniel Oyelaran', role: 'Buyer · Ridgeline Supply', email: 'd.oyelaran@ridgeline.uk', phone: '+44 141 332 5540', city: 'Glasgow', country: 'UK', address: '88 Bath Street, Glasgow G2 2EH', terms: '60 days', since: 'Customer since 2024',
    orders: [{ product: 'Terry crew sweat', meta: 'SO-2286 · 3,200 pcs · ships 12 Sep', stage: 'sourcing' }],
    invoices: [{ ref: 'INV-1181', amount: 16400, due: 'overdue 3 days', status: 'overdue' }, { ref: 'INV-1149', amount: 21900, due: 'paid 05 Aug', status: 'paid' }],
  },
  {
    id: 'c7', type: 'company', name: 'Karve Outdoor', contact: 'Sara Whitlock', role: 'Production manager', email: 'sara@karveoutdoor.com', phone: '+44 117 908 4412', city: 'Bristol', country: 'UK', address: 'Wapping Wharf, Bristol BS1 6WE', terms: '30 days', since: 'Customer since 2020',
    orders: [],
    invoices: [{ ref: 'INV-1179', amount: 18300, due: 'paid 08 Aug', status: 'paid' }, { ref: 'INV-1120', amount: 24600, due: 'paid 14 Jun', status: 'paid' }],
  },
];
