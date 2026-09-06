/**
 * Live finance writers — the reference ERP's own collections:
 *   expenses          → `finance_expenses`
 *   journal entries   → `journal_entries`
 *   bank transactions → `bank_transactions`
 *
 * VAT bills, order costs and account opening balances have no live collection
 * (or no live field) and stay mock-only.
 */

import { createDocument, patchDocument, removeDocument } from '@/lib/supabase/write';
import { getActor } from '@/data/notifications/actor';

import { expenseCategory } from './mock';

import type { BankTransaction, Expense, JournalEntry } from './types';

const EXPENSES = 'finance_expenses';
const JOURNAL = 'journal_entries';
const BANK = 'bank_transactions';

// ---- Expenses ----

function expenseToLive(e: Partial<Expense>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  // The live column is free text holding the reference's own category string.
  if (e.category !== undefined) out.category = expenseCategory(e.category).label;
  if (e.amountNPR !== undefined) out.amountNPR = e.amountNPR;
  if (e.date !== undefined) out.date = e.date;
  if (e.note !== undefined || e.name !== undefined) out.note = e.note || e.name || '';
  if (e.vatBill !== undefined) out.vatBill = e.vatBill;
  if (e.status !== undefined) out.status = e.status;
  return out;
}

export async function addExpense(expense: Expense): Promise<void> {
  await createDocument(EXPENSES, { ...expenseToLive(expense), loggedBy: getActor()?.name ?? 'kazi-mobile' });
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
  const fields = expenseToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(EXPENSES, id, fields);
}

export async function deleteExpense(id: string): Promise<void> {
  await removeDocument(EXPENSES, id);
}

export async function restoreExpenses(_previous: Expense[]): Promise<void> {
  /* snapshot undo — not reversed in Firestore this pass */
}

// ---- Journal entries ----

function journalToLive(e: Partial<JournalEntry>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.date !== undefined) out.date = e.date;
  if (e.description !== undefined) out.description = e.description;
  if (e.debitAccount !== undefined) out.debitAccount = e.debitAccount;
  if (e.creditAccount !== undefined) out.creditAccount = e.creditAccount;
  if (e.amountNPR !== undefined) out.amountNPR = e.amountNPR;
  if (e.reference !== undefined) out.reference = e.reference;
  return out;
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await createDocument(JOURNAL, { ...journalToLive(entry), createdBy: entry.createdBy || getActor()?.name || 'kazi-mobile' });
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<void> {
  const fields = journalToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(JOURNAL, id, fields);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await removeDocument(JOURNAL, id);
}

export async function restoreJournalEntries(_previous: JournalEntry[]): Promise<void> {
  /* snapshot undo — not reversed in Firestore this pass */
}

// ---- Bank transactions ----

function bankToLive(t: Partial<BankTransaction>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (t.date !== undefined) out.date = t.date;
  if (t.direction !== undefined) out.type = t.direction;
  if (t.amountNPR !== undefined) out.amount = t.amountNPR;
  if (t.description !== undefined) out.remarks = t.description;
  return out;
}

export async function addBankTransaction(tx: BankTransaction): Promise<void> {
  await createDocument(BANK, bankToLive(tx));
}

export async function updateBankTransaction(id: string, updates: Partial<BankTransaction>): Promise<void> {
  const fields = bankToLive(updates);
  if (Object.keys(fields).length > 0) await patchDocument(BANK, id, fields);
}

export async function deleteBankTransaction(id: string): Promise<void> {
  await removeDocument(BANK, id);
}

export async function restoreBankTransactions(_previous: BankTransaction[]): Promise<void> {
  /* snapshot undo — not reversed in Firestore this pass */
}
