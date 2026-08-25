import type { CompanyInfo, Director, DirectorGroupDef, OfficeInfo } from './types';

export const COMPANY_INFO: CompanyInfo = {
  description:
    'A family-run garment maker in Balaju, Kathmandu, cutting and sewing for UK and EU brands since 1998. Own plant, own QC, own people — 412 on roll across three lines.',
  founded: '1998',
  onRoll: '412',
  pcsPerMonth: '180k',
};

export const MODEL_DESCRIPTION =
  'Brands buy from the factory that makes the garment. One margin, one QC report, one point of accountability — from fabric booking to FOB Kathmandu.';

export const MODEL_TAGS = ['FOB Kathmandu', 'In-house QC', 'SEDEX audited', 'MOQ 1,000 pcs'];

export const OFFICES: OfficeInfo[] = [
  { city: 'Kathmandu', dotTone: 'accent', lines: ['Balaju Industrial District', '3 lines · 412 staff', 'GMT+5:45 · 08:00–17:00'], role: 'Plant & head office' },
  { city: 'London', dotTone: 'warning', lines: ['Hoxton, London N1', '4 staff · Kazi Trading UK', 'GMT+1 · 09:00–18:00'], role: 'Sales & shipping' },
];

export const GROUPS: DirectorGroupDef[] = [
  { key: 'nepal', title: 'Nepal team', meta: 'Balaju plant · GMT+5:45' },
  { key: 'admin', title: 'Nepal admins', meta: 'Office · GMT+5:45' },
  { key: 'uk', title: 'UK & other', meta: 'London · GMT+1' },
];

export const REGISTERED_ENTITY_LINES = [
  'Kazi Manufacturing Pvt. Ltd. · PAN 601234567',
  'Balaju Industrial District, Kathmandu 44600',
  'Kazi Trading UK Ltd · Co. 09884412 · London N1',
];

export const PEOPLE: Director[] = [
  {
    id: 1, name: 'Bikash Kazi', role: 'Managing Director', group: 'nepal', office: 'Kathmandu', tag: 'KTM', since: 'since 1998', tenure: '28 yrs', email: 'bikash@kazimfg.com',
    bio: 'Founded the Balaju plant with eight machines and one buyer. Still signs every fabric booking over NPR 20 lakh and walks the sewing floor before the morning meeting.',
    remit: ['Strategy', 'Buyer relationships', 'Capex'], avatarInitials: 'BK', avatarTint: 'dark',
  },
  {
    id: 2, name: 'Sujan Shrestha', role: 'Director · Production', group: 'nepal', office: 'Kathmandu', tag: 'KTM', since: 'since 2004', tenure: '22 yrs', email: 'sujan@kazimfg.com',
    bio: 'Owns the three sewing lines and the plan that feeds them. Escalation point for any order that slips its cut date by more than 48 hours.',
    remit: ['Line planning', 'Output', 'Overtime'], avatarInitials: 'SS', avatarTint: 'mint',
  },
  {
    id: 3, name: 'Nirmala Kazi', role: 'Director · Sourcing & Compliance', group: 'nepal', office: 'Kathmandu', tag: 'KTM', since: 'since 2009', tenure: '17 yrs', email: 'nirmala@kazimfg.com',
    bio: 'Books fabric and trim, and holds the audit file. Runs the SEDEX and buyer social audits — the reason Kazi ships to EU retailers without an agent in between.',
    remit: ['Fabric & trim', 'Audits', 'Supplier terms'], avatarInitials: 'NK', avatarTint: 'clay',
  },
  {
    id: 4, name: 'Rajesh Tamang', role: 'Factory Director · Balaju', group: 'nepal', office: 'Kathmandu', tag: 'KTM', since: 'since 2013', tenure: '13 yrs', email: 'rajesh@kazimfg.com',
    bio: 'Runs the plant day to day: shifts, maintenance, machine capex and the gate. Signs off QC holds before anything is packed.',
    remit: ['Plant ops', 'QC holds', 'Maintenance'], avatarInitials: 'RT', avatarTint: 'draft',
  },
  {
    id: 5, name: 'Kabita Adhikari', role: 'HR & Payroll admin', group: 'admin', office: 'Kathmandu', tag: 'ADMIN', since: 'since 2019', tenure: '7 yrs', email: 'kabita@kazimfg.com',
    bio: 'Keeps the roll, the SSF filings and the monthly payroll run. First contact for any wage, leave or contract question on the floor.',
    remit: ['Payroll', 'Contracts', 'SSF'], avatarInitials: 'KA', avatarTint: 'clay',
  },
  {
    id: 6, name: 'Prakash Neupane', role: 'Accounts admin', group: 'admin', office: 'Kathmandu', tag: 'ADMIN', since: 'since 2016', tenure: '10 yrs', email: 'prakash@kazimfg.com',
    bio: 'Ledgers, VAT returns and supplier payments. Reconciles the London invoices against FOB shipments every month end.',
    remit: ['Ledger', 'VAT', 'Payables'], avatarInitials: 'PN', avatarTint: 'mint',
  },
  {
    id: 7, name: 'Sarita Lama', role: 'Systems & ERP admin', group: 'admin', office: 'Kathmandu', tag: 'ADMIN', since: 'since 2021', tenure: '5 yrs', email: 'sarita@kazimfg.com',
    bio: 'Owns this app: user roles, device rollout on the floor and the nightly export to accounting. Raise access requests here.',
    remit: ['User roles', 'Devices', 'Data exports'], avatarInitials: 'SL', avatarTint: 'amber',
  },
  {
    id: 8, name: 'Deepak Malla', role: 'Director · UK & EU', group: 'uk', office: 'London', tag: 'LDN', since: 'since 2011', tenure: '15 yrs', email: 'deepak@kazitrading.co.uk',
    bio: 'Fronts Kazi to UK and EU brands, negotiates prices and takes the first call when a delivery date moves. Sees the same numbers as Kathmandu, six hours behind.',
    remit: ['Buyers', 'Pricing', 'Shipping'], avatarInitials: 'DM', avatarTint: 'dark',
  },
  {
    id: 9, name: 'Hannah Whitmore', role: 'Commercial Director', group: 'uk', office: 'London', tag: 'LDN', since: 'since 2018', tenure: '8 yrs', email: 'hannah@kazitrading.co.uk',
    bio: 'Runs the order book and the sampling calendar out of the London office. Owns costing sheets and buyer onboarding for new accounts.',
    remit: ['Order book', 'Costing', 'Sampling'], avatarInitials: 'HW', avatarTint: 'mint',
  },
  {
    id: 10, name: 'Arun Kazi', role: 'Non-executive Director', group: 'uk', office: 'Dubai', tag: 'DXB', since: 'since 2015', tenure: '11 yrs', email: 'arun@kazimfg.com',
    bio: 'Advises on finance and expansion; attends the quarterly board only. Not in the approval chain for day-to-day operations.',
    remit: ['Board', 'Finance', 'Expansion'], avatarInitials: 'AK', avatarTint: 'draft',
  },
];
