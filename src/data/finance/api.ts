/**
 * Data-source selector for the finance module.
 *   reads  → expenses / accounts / journal / bank from Firestore when configured
 *   writes → expenses / journal / bank to Firestore when configured, mirrored to mock
 *
 * VAT bills, order costs and `updateAccountOpening` have no live collection /
 * field and stay entirely mock. Snapshot-undo restores are not reversed
 * server-side.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { withMockFallback } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

// Mock-only: no live collection / field, or the rules forbid it.
// `deleteJournalEntry` — `journal_entries` is `allow delete: if false` (ledger
// entries are immutable in the reference ERP); the mobile delete is local only.
export {
  fetchVatBills,
  addVatBill,
  deleteVatBill,
  restoreVatBills,
  updateAccountOpening,
  fetchOrderCosts,
  upsertOrderCosts,
  deleteOrderCosts,
  restoreOrderCosts,
  deleteJournalEntry,
} from './mock-api';

export const fetchExpenses = isSupabaseConfigured
  ? withMockFallback('finance/expenses', live.fetchExpenses, mock.fetchExpenses)
  : mock.fetchExpenses;

export const fetchAccounts = isSupabaseConfigured
  ? withMockFallback('finance/accounts', live.fetchAccounts, mock.fetchAccounts)
  : mock.fetchAccounts;

export const fetchJournalEntries = isSupabaseConfigured
  ? withMockFallback('finance/journal', live.fetchJournalEntries, mock.fetchJournalEntries)
  : mock.fetchJournalEntries;

export const fetchBankTransactions = isSupabaseConfigured
  ? withMockFallback('finance/bank', live.fetchBankTransactions, mock.fetchBankTransactions)
  : mock.fetchBankTransactions;

export const addExpense = liveWrite('finance/addExpense', writeLive.addExpense, mock.addExpense);
export const updateExpense = liveWrite('finance/updateExpense', writeLive.updateExpense, mock.updateExpense);
export const deleteExpense = liveWrite('finance/deleteExpense', writeLive.deleteExpense, mock.deleteExpense);
export const restoreExpenses = liveWrite('finance/restoreExpenses', writeLive.restoreExpenses, mock.restoreExpenses);

export const addJournalEntry = liveWrite('finance/addJournalEntry', writeLive.addJournalEntry, mock.addJournalEntry);
export const updateJournalEntry = liveWrite('finance/updateJournalEntry', writeLive.updateJournalEntry, mock.updateJournalEntry);
export const restoreJournalEntries = liveWrite(
  'finance/restoreJournalEntries',
  writeLive.restoreJournalEntries,
  mock.restoreJournalEntries,
);

export const addBankTransaction = liveWrite('finance/addBankTransaction', writeLive.addBankTransaction, mock.addBankTransaction);
export const deleteBankTransaction = liveWrite(
  'finance/deleteBankTransaction',
  writeLive.deleteBankTransaction,
  mock.deleteBankTransaction,
);
export const restoreBankTransactions = liveWrite(
  'finance/restoreBankTransactions',
  writeLive.restoreBankTransactions,
  mock.restoreBankTransactions,
);
