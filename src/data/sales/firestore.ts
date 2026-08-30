/**
 * Live `orders` reader (Track B, read-only). The `orders` collection is the
 * single source of truth for Sales (overview) and Order Management (board).
 * Writes still go through `mock-api.ts` (in-memory only this pass).
 *
 * Live shape (field list sampled 2026-08-30):
 *   { orderId, customerName, styleName, quantity, stage (from stage_config, ~8),
 *     status, priority?, date, deliveryDate, assignedTo, pricePerPcNPR,
 *     totalValueNPR, colorway, sampleId/Name, invoiceRef, notes, stageHistory,
 *     createdBy, createdAt }
 *
 * Gaps handled locally (see plan §Batch 1):
 *   - 8-stage `stage`      → mapped to the mobile 5-stage chain
 *   - `notes`/`stageHistory` come back as JSON string OR array → `parseMaybeJson`
 *   - no `city/channel/terms/po/sizes` → defaults; `ship*` derived from deliveryDate
 */

import { num, parseMaybeJson, str, tsToISO } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/firestore/read';

import { STAGE_IDS, stageIndex } from './mock';
import type { Order, OrderNote, OrderPriority, StageHistoryEntry, StageId } from './types';

/** Reference `stage_config` chain (~8 stages) → the mobile 5-stage chain, by keyword. */
function mapStage(raw: unknown): StageId {
  const s = str(raw).trim().toLowerCase();
  if (/(cut)/.test(s)) return 'cutting';
  if (/(sew|stitch|print|finish|press|assembl)/.test(s)) return 'finishing';
  if (/(qc|quality|pack|ship|dispatch)/.test(s)) return 'packing';
  if (/(deliver|complete|done|closed)/.test(s)) return 'delivered';
  return 'sourcing';
}

function mapPriority(raw: unknown): OrderPriority {
  return str(raw).trim().toLowerCase() === 'high' ? 'high' : 'normal';
}

function mapStatus(raw: unknown): Order['status'] {
  return /cancel/i.test(str(raw)) ? 'cancelled' : 'active';
}

/** "2026-09-08" → "08 Sep"; empty/invalid → "". */
function shipLabel(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

function shipDays(iso: string): number {
  if (!iso) return 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - start.getTime()) / 86_400_000);
}

/** Back-fill a full history up to `stage` when the live one is missing/unparseable. */
function historyTo(stage: StageId, endISO: string): StageHistoryEntry[] {
  const end = stageIndex(stage);
  const endMs = new Date(endISO || Date.now()).getTime() || Date.now();
  return STAGE_IDS.slice(0, end + 1).map((s, i) => ({
    stage: s,
    at: new Date(endMs - (end - i) * 86_400_000).toISOString(),
  }));
}

function mapHistory(raw: unknown, stage: StageId, fallbackISO: string): StageHistoryEntry[] {
  const parsed = parseMaybeJson<unknown[]>(raw, []);
  if (Array.isArray(parsed) && parsed.length) {
    const rows = parsed
      .map((e) => {
        const entry = (e ?? {}) as DocData;
        return {
          stage: mapStage(entry.stage ?? entry.to ?? entry.name),
          at: tsToISO(entry.at ?? entry.date ?? entry.timestamp) || fallbackISO,
        };
      })
      .filter((r) => r.at);
    if (rows.length) return rows;
  }
  return historyTo(stage, fallbackISO);
}

function mapNotes(raw: unknown, fallbackISO: string, who: string): OrderNote[] {
  const parsed = parseMaybeJson<unknown>(raw, null);
  if (Array.isArray(parsed)) {
    return parsed.map((e, i) => {
      const entry = (e ?? {}) as DocData;
      return {
        id: str(entry.id) || `n${i + 1}`,
        body: str(entry.body ?? entry.text ?? entry.note).trim(),
        at: tsToISO(entry.at ?? entry.date) || fallbackISO,
        who: str(entry.who ?? entry.by ?? entry.author) || who,
      };
    }).filter((n) => n.body);
  }
  const body = str(parsed ?? raw).trim();
  return body ? [{ id: 'n1', body, at: fallbackISO, who }] : [];
}

function mapOrderDoc(id: string, d: DocData): Order | null {
  const customer = str(d.customerName).trim();
  const ref = str(d.orderId).trim() || `SO-${id.slice(0, 5).toUpperCase()}`;
  if (!customer && !str(d.styleName).trim()) return null;

  const stage = mapStage(d.stage);
  const qty = num(d.quantity);
  const value = num(d.totalValueNPR) || qty * num(d.pricePerPcNPR);
  const deliveryISO = tsToISO(d.deliveryDate);
  const createdISO = tsToISO(d.createdAt) || tsToISO(d.date) || new Date().toISOString();
  const who = str(d.createdBy) || str(d.assignedTo) || 'Team';

  return {
    id,
    ref,
    customer: customer || '—',
    city: '',
    product: str(d.styleName).trim() || str(d.sampleName).trim() || '—',
    qty,
    stage,
    ship: shipLabel(deliveryISO),
    shipDays: shipDays(deliveryISO),
    value,
    po: str(d.invoiceRef).trim(),
    channel: '',
    terms: '',
    sizes: [],
    priority: mapPriority(d.priority),
    status: mapStatus(d.status),
    assignedTo: str(d.assignedTo).trim(),
    stageHistory: mapHistory(d.stageHistory, stage, createdISO),
    // live docs carry the free-text notes on `notes` OR a JSON-string `notesList`
    notes: mapNotes(str(d.notes).trim() ? d.notes : (d.notesList ?? d.notes), createdISO, who),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  return readCollection('orders', mapOrderDoc);
}
