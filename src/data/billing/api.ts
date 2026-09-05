/**
 * Data-source selector for the billing module.
 *   reads  → `fetchInvoices` / `fetchQuotations` from Supabase when configured
 *   writes → invoice/quotation UPDATES + payments to Firestore; CREATES stay mock
 *
 * `addInvoice` / `addQuotation` are deliberately mock-only: the reference ERP
 * issues gap-free sequential numbers via a `counters/billing` transaction, and
 * the rules make invoices/quotations/challans un-deletable (IRD documents).
 * Writing one from mobile without bumping that counter would collide with the
 * website's numbering — port the counter first. Challan creates are mock for
 * the same reason; challan READS come from the live `challans` table.
 * Snapshot-undo restores are not reversed server-side.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { liveRead } from '@/lib/supabase/read';
import { liveWrite } from '@/lib/supabase/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export {
  removeOpenChallan,
  addChallan,
  // Creates stay mock — see the file header (sequential-number contract).
  addInvoice,
  addQuotation,
} from './mock-api';

export const fetchInvoices = isSupabaseConfigured
  ? liveRead('billing/invoices', live.fetchInvoices)
  : mock.fetchInvoices;

export const fetchQuotations = isSupabaseConfigured
  ? liveRead('billing/quotations', live.fetchQuotations)
  : mock.fetchQuotations;

export const fetchChallans = isSupabaseConfigured
  ? liveRead('billing/challans', live.fetchChallans)
  : mock.fetchChallans;

export const fetchOpenChallans = isSupabaseConfigured
  ? liveRead('billing/openChallans', live.fetchOpenChallans)
  : mock.fetchOpenChallans;

export const updateChallan = liveWrite('billing/updateChallan', writeLive.updateChallan, mock.updateChallan);
export const updateChallanStatus = liveWrite(
  'billing/updateChallanStatus',
  writeLive.updateChallanStatus,
  mock.updateChallanStatus,
);
export const restoreChallans = liveWrite('billing/restoreChallans', writeLive.restoreChallans, mock.restoreChallans);

export const updateInvoice = liveWrite('billing/updateInvoice', writeLive.updateInvoice, mock.updateInvoice);
export const addPayment = liveWrite('billing/addPayment', writeLive.addPayment, mock.addPayment);
export const restoreInvoices = liveWrite('billing/restoreInvoices', writeLive.restoreInvoices, mock.restoreInvoices);

export const updateQuotation = liveWrite('billing/updateQuotation', writeLive.updateQuotation, mock.updateQuotation);
export const updateQuotationStatus = liveWrite(
  'billing/updateQuotationStatus',
  writeLive.updateQuotationStatus,
  mock.updateQuotationStatus,
);
export const restoreQuotations = liveWrite('billing/restoreQuotations', writeLive.restoreQuotations, mock.restoreQuotations);
