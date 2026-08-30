/**
 * Live finance readers (Track B, read-only): `finance_expenses`, `accounts`,
 * `journal_entries`, `bank_transactions`. Writes stay on `mock-api.ts`, and
 * `fetchVatBills` / `fetchOrderCosts` stay mock entirely — those collections
 * don't exist live (FRONTEND_GAP_PLAN §6).
 *
 * Live shapes (sampled 2026-08-30):
 *   finance_expenses    { category (free text), amountNPR, date, note, vatBill, status ("Paid"), loggedBy, createdAt }
 *   accounts            { name, type (Asset/Liability/Equity/Income/Expense), createdAt } — ~114 docs, no opening balance
 *   journal_entries     { date, description, debitAccount, creditAccount, amountNPR, reference, createdBy, createdAt }
 *   bank_transactions   { date ("2026-07-31 20:01"), type ("Debit"/"Credit"), amount, balance, remarks, timestamp, createdAt }
 */

import { bool, dedupeByName, num, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import type {
  Account,
  AccountType,
  BankTransaction,
  Expense,
  ExpenseCategoryId,
  JournalEntry,
} from './types';

// --- Expenses ---

/** Free-text live `category` → the mobile 6-bucket set. */
function mapExpenseCategory(raw: unknown): ExpenseCategoryId {
  const s = str(raw).trim().toLowerCase();
  if (/(util|power|electric|water|internet|phone|recharge)/.test(s)) return 'power';
  if (/(wage|salary|payroll|staff|welfare)/.test(s)) return 'wages';
  if (/(transport|freight|deliver|shipping|logistic|fuel)/.test(s)) return 'freight';
  if (/(rent|lease)/.test(s)) return 'rent';
  if (/(repair|maintenance|service|machine)/.test(s)) return 'repairs';
  return 'admin';
}

function mapExpenseDoc(id: string, d: DocData): Expense | null {
  const amountNPR = num(d.amountNPR);
  const note = str(d.note).trim();
  const category = str(d.category).trim();
  if (!amountNPR && !note && !category) return null;
  return {
    id,
    category: mapExpenseCategory(d.category),
    name: note || category || 'Expense',
    note,
    amountNPR,
    date: str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10),
    source: 'Cash',
    vatBill: bool(d.vatBill),
    status: /unpaid|payable/i.test(str(d.status)) ? 'Unpaid' : 'Paid',
    loggedBy: str(d.loggedBy).trim(),
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  return readCollection('finance_expenses', mapExpenseDoc);
}

// --- Chart of accounts ---

const ACCOUNT_TYPES: AccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];

function mapAccountDoc(id: string, d: DocData): (Account & { createdAt: string }) | null {
  const name = str(d.name).trim();
  if (!name) return null;
  const typeRaw = str(d.type).trim();
  return {
    id,
    name,
    type: ACCOUNT_TYPES.find((t) => t.toLowerCase() === typeRaw.toLowerCase()) ?? 'Asset',
    openingBalanceNPR: 0, // not stored live; the ledger view derives running balances
    createdAt: tsToISO(d.createdAt),
  };
}

export async function fetchAccounts(): Promise<Account[]> {
  const rows = await readCollection('accounts', mapAccountDoc);
  // ~114 live docs, many user-created duplicates of the reference's clean set.
  return dedupeByName(rows).map(({ createdAt: _drop, ...a }) => a);
}

// --- Journal entries ---

function mapJournalDoc(id: string, d: DocData): JournalEntry | null {
  const amountNPR = num(d.amountNPR);
  const debitAccount = str(d.debitAccount).trim();
  const creditAccount = str(d.creditAccount).trim();
  if (!amountNPR || (!debitAccount && !creditAccount)) return null;
  return {
    id,
    date: str(d.date).trim() || tsToISO(d.createdAt).slice(0, 10),
    description: str(d.description).trim(),
    debitAccount,
    creditAccount,
    amountNPR,
    reference: str(d.reference).trim(),
    createdBy: str(d.createdBy).trim(),
  };
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  return readCollection('journal_entries', mapJournalDoc);
}

// --- Bank feed ---

function mapBankDoc(id: string, d: DocData): BankTransaction | null {
  const amountNPR = num(d.amount);
  if (!amountNPR) return null;
  const rawDate = str(d.date).trim();
  return {
    id,
    bankAccount: 'Bank feed',
    date: (rawDate.split(' ')[0] || tsToISO(d.createdAt).slice(0, 10)),
    description: str(d.remarks).trim(),
    amountNPR,
    direction: /credit/i.test(str(d.type)) ? 'Credit' : 'Debit',
    category: '',
    reference: '',
    loggedBy: 'Bank feed',
  };
}

export async function fetchBankTransactions(): Promise<BankTransaction[]> {
  return readCollection('bank_transactions', mapBankDoc);
}
