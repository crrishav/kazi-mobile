/**
 * Data-source selector for the billing module.
 *   reads  → `fetchInvoices` / `fetchQuotations` from Firestore when configured
 *   writes → invoice/quotation UPDATES + payments to Firestore; CREATES stay mock
 *
 * `addInvoice` / `addQuotation` are deliberately mock-only: the reference ERP
 * issues gap-free sequential numbers via a `counters/billing` transaction, and
 * the rules make invoices/quotations/challans un-deletable (IRD documents).
 * Writing one from mobile without bumping that counter would collide with the
 * website's numbering — port the counter first. Challans have no live collection.
 * Snapshot-undo restores are not reversed server-side.
 */

import { isFirebaseConfigured } from '@/lib/firebase';
import { withMockFallback } from '@/lib/firestore/read';
import { liveWrite } from '@/lib/firestore/write';

import * as live from './firestore';
import * as writeLive from './firestore-write';
import * as mock from './mock-api';

export {
  fetchOpenChallans,
  removeOpenChallan,
  fetchChallans,
  addChallan,
  updateChallanStatus,
  restoreChallans,
  // Creates stay mock — see the file header (sequential-number contract).
  addInvoice,
  addQuotation,
} from './mock-api';

export const fetchInvoices = isFirebaseConfigured
  ? withMockFallback('billing/invoices', live.fetchInvoices, mock.fetchInvoices)
  : mock.fetchInvoices;

export const fetchQuotations = isFirebaseConfigured
  ? withMockFallback('billing/quotations', live.fetchQuotations, mock.fetchQuotations)
  : mock.fetchQuotations;

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
