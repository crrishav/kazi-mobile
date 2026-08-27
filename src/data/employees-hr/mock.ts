import type { Employee, PayMonth } from './types';

export const BANKS = ['NIC Asia', 'Nabil Bank', 'Global IME', 'Machhapuchchhre'];
export const DEPTS = ['Sewing', 'Cutting', 'Finishing', 'Packing', 'QC', 'Store', 'Office', 'Maintenance'];

export const PEOPLE: Employee[] = [
  { id: 1, code: 'KZ-0118', name: 'Anil Karki', role: 'Cutting master', dept: 'Cutting', active: true, joined: '12 Mar 2021', bank: 'NIC Asia', acct: '8830011922451', branch: 'Balaju', basic: 24500, allow: 2500, otH: 12, otR: 210, bonus: 1500, adv: 0, absent: 0, late: 0, tax: 0, avatarInitials: 'AK', avatarTint: 'mint', reportsTo: 8 },
  { id: 2, code: 'KZ-0142', name: 'Pramila Thapa', role: 'Sewing operator', dept: 'Sewing', active: true, joined: '02 Aug 2022', bank: 'Nabil Bank', acct: '0912045500123', branch: 'Gongabu', basic: 18600, allow: 2000, otH: 18, otR: 160, bonus: 1400, adv: 2000, absent: 1, late: 3, tax: 0, avatarInitials: 'PT', avatarTint: 'clay', reportsTo: 3 },
  { id: 3, code: 'KZ-0151', name: 'Rabin Bhandari', role: 'Finishing lead', dept: 'Finishing', active: true, joined: '19 Jan 2020', bank: 'Global IME', acct: '3401007745012', branch: 'Balaju', basic: 22000, allow: 2200, otH: 9, otR: 180, bonus: 1200, adv: 3000, absent: 0, late: 0, tax: 0, avatarInitials: 'RB', avatarTint: 'draft', reportsTo: 8 },
  { id: 4, code: 'KZ-0166', name: 'Manisha Gurung', role: 'Packing operator', dept: 'Packing', active: true, joined: '05 Sep 2023', bank: 'Machhapuchchhre', acct: '0450100223311', branch: 'Kalanki', basic: 16400, allow: 1600, otH: 6, otR: 150, bonus: 900, adv: 0, absent: 0, late: 2, tax: 0, avatarInitials: 'MG', avatarTint: 'amber', reportsTo: 3 },
  { id: 5, code: 'KZ-0173', name: 'Deepak Shrestha', role: 'QC inspector', dept: 'QC', active: false, joined: '22 Jun 2021', left: 'resigned 12 Aug 2026', bank: 'NIC Asia', acct: '8830022107884', branch: 'Balaju', basic: 21000, allow: 2100, otH: 0, otR: 190, bonus: 1000, adv: 0, absent: 0, late: 0, tax: 0, avatarInitials: 'DS', avatarTint: 'draft', reportsTo: 8 },
  { id: 6, code: 'KZ-0181', name: 'Sunita Rai', role: 'Sewing operator', dept: 'Sewing', active: true, joined: '14 Feb 2023', bank: 'Nabil Bank', acct: '0912045500887', branch: 'Gongabu', basic: 18600, allow: 2000, otH: 14, otR: 160, bonus: 1400, adv: 0, absent: 0, late: 0, tax: 0, avatarInitials: 'SR', avatarTint: 'dark', reportsTo: 3 },
  { id: 7, code: 'KZ-0190', name: 'Bimal Katwal', role: 'Store keeper', dept: 'Store', active: true, joined: '30 Nov 2021', bank: 'Global IME', acct: '3401007745766', branch: 'Balaju', basic: 19500, allow: 1950, otH: 8, otR: 170, bonus: 1100, adv: 1500, absent: 0, late: 3, tax: 0, avatarInitials: 'BK', avatarTint: 'mint', reportsTo: 1 },
  { id: 8, code: 'KZ-0203', name: 'Kabita Adhikari', role: 'HR & payroll', dept: 'Office', active: true, joined: '08 Jul 2019', bank: 'NIC Asia', acct: '8830033415207', branch: 'Kathmandu', basic: 34000, allow: 3400, otH: 0, otR: 0, bonus: 2000, adv: 0, absent: 0, late: 0, tax: 374, avatarInitials: 'KA', avatarTint: 'clay' },
  { id: 9, code: 'KZ-0211', name: 'Suresh Magar', role: 'Maintenance fitter', dept: 'Maintenance', active: false, joined: '17 Apr 2022', left: 'contract ended 31 Jul 2026', bank: 'Nabil Bank', acct: '0912045501442', branch: 'Balaju', basic: 17800, allow: 1780, otH: 4, otR: 165, bonus: 900, adv: 0, absent: 0, late: 0, tax: 0, avatarInitials: 'SM', avatarTint: 'draft', reportsTo: 1 },
];

export const MONTHS: PayMonth[] = [
  { key: 'aug', label: 'Aug 2026', period: '1 – 31 Aug 2026', days: 22, factor: 1, open: true, payDate: '31 Aug 2026' },
  { key: 'jul', label: 'Jul 2026', period: '1 – 31 Jul 2026', days: 23, factor: 0.8, open: false, payDate: '31 Jul 2026' },
  { key: 'jun', label: 'Jun 2026', period: '1 – 30 Jun 2026', days: 21, factor: 1.15, open: false, payDate: '30 Jun 2026' },
];
