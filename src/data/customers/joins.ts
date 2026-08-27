/**
 * Customer history joins (item 35). The Customers detail view historically read
 * hand-authored `orders[]` / `invoices[]` off each seed record. Where a customer
 * name matches the live Sales `orders` and Billing `invoices` collections, derive
 * those sections from the real data instead; unmatched customers keep their seed
 * arrays as a fallback.
 */

import { CLIENTS } from '@/data/billing/mock';
import type { Invoice } from '@/data/billing/types';
import { nprOf, statusFull, total } from '@/data/billing/utils';
import type { Order } from '@/data/sales/types';
import { toGBP } from '@/lib/currency';

import type { CustomerInvoice, CustomerOrder, InvoiceStatus, OrderStageId } from './types';

/** Sales stages that map onto the customer card's 4-stage chip set; 'delivered' collapses to 'packing'. */
function toCustomerStage(stage: Order['stage']): OrderStageId {
  return stage === 'delivered' ? 'packing' : stage;
}

/** Open Sales orders for a customer, in the customer-card display shape. */
export function ordersForCustomer(orders: Order[], name: string): CustomerOrder[] {
  return orders
    .filter((o) => o.customer.toLowerCase() === name.toLowerCase() && o.stage !== 'delivered')
    .map((o) => ({
      product: o.product,
      meta: `${o.ref} · ${o.qty.toLocaleString('en-US')} pcs · ships ${o.ship}`,
      stage: toCustomerStage(o.stage),
    }));
}

function toCustomerInvoiceStatus(v: Invoice): InvoiceStatus | null {
  const s = statusFull(v);
  if (s === 'Cancelled') return null;
  if (s === 'Paid') return 'paid';
  if (s === 'Overdue') return 'overdue';
  return 'open';
}

/** Billing invoices for a customer (matched by client name), GBP-normalised for the card. */
export function invoicesForCustomer(invoices: Invoice[], name: string): CustomerInvoice[] {
  const target = name.toLowerCase();
  return invoices
    .filter((v) => (v.clientName ?? CLIENTS[v.client]?.name ?? '').toLowerCase() === target)
    .map((v) => {
      const status = toCustomerInvoiceStatus(v);
      if (!status) return null;
      // GBP invoices are already in GBP; others convert via their booked NPR rate.
      const amountGBP = v.cur === 'GBP' ? Math.round(total(v)) : Math.round(toGBP(nprOf(v, total(v))));
      const due = status === 'paid' ? `paid · ${v.issued}` : status === 'overdue' ? `overdue · was due ${v.due}` : `due ${v.due}`;
      return { ref: v.ref, amount: amountGBP, due, status };
    })
    .filter((x): x is CustomerInvoice => x !== null);
}
