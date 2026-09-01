/**
 * Live inventory readers (Track B, read-only): `inventory` (stock), plus
 * `fabrics` + `processes` + `patterns` merged into the Library. Writes stay on
 * `mock-api.ts`.
 *
 * Live shapes (sampled 2026-08-30):
 *   inventory  { itemId ("#kazi1009"), item, category, unit, supplier, location,
 *                openingStock, minLevel, unitCostNPR, owner, condition, createdBy, createdAt }
 *   fabrics    { name, type, gsm, composition, weight, status, swatchImageUrl (base64 — NOT read) }
 *   processes  { name, category, description, cost_per_unit, lead_time_days, min_quantity }
 *   patterns   { name, styleNo, product_type, category, sizes_available[], tech_pack_url (base64 — NOT read) }
 *
 * Gaps handled locally (see plan §Batch 3):
 *   - no running `qty` and no `stock_movements` collection → `qty = openingStock`
 *     (open question at checkpoint: add a "from opening balance" caption)
 *   - `fetchMovements` → `[]` (no live per-item ledger)
 *   - base64 image fields deliberately not read
 */

import { num, str } from '@/lib/firestore/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import type { LibraryItem, StockItem, StockMovement } from './types';

function mapStockDoc(id: string, d: DocData): StockItem | null {
  const name = str(d.item).trim();
  if (!name) return null;
  const category = str(d.category).trim();
  const cost = num(d.unitCostNPR);
  return {
    id,
    name,
    sku: str(d.itemId).trim(),
    supplier: str(d.supplier).trim(),
    qty: num(d.openingStock),
    threshold: num(d.minLevel),
    unit: str(d.unit).trim() || 'pcs',
    swatch: '#EDEFEC',
    swatchFg: '#3B4F47',
    swatchLabel: (category || name).slice(0, 3).toUpperCase(),
    lead: '',
    location: str(d.location).trim(),
    cost: cost ? `रु ${cost.toLocaleString('en-US')}` : '',
    batches: '',
  };
}

export async function fetchStock(): Promise<StockItem[]> {
  return readCollection('inventory', mapStockDoc);
}

function mapFabricDoc(id: string, d: DocData): LibraryItem | null {
  const name = str(d.name).trim();
  if (!name) return null;
  const gsm = num(d.gsm);
  return {
    id: `fab_${id}`,
    group: 'Fabrics',
    kind: 'Fabric',
    name,
    meta: [gsm ? `${gsm} GSM` : '', str(d.composition).trim(), str(d.type).trim()].filter(Boolean).join(' · '),
    tags: [str(d.status).trim()].filter(Boolean),
  };
}

function mapProcessDoc(id: string, d: DocData): LibraryItem | null {
  const name = str(d.name).trim();
  if (!name) return null;
  const cost = num(d.cost_per_unit);
  const lead = num(d.lead_time_days);
  return {
    id: `proc_${id}`,
    group: 'Processes',
    kind: 'Process',
    name,
    meta: [str(d.category).trim(), cost ? `रु ${cost}/unit` : '', lead ? `${lead}d lead` : ''].filter(Boolean).join(' · '),
    tags: [],
  };
}

function mapPatternDoc(id: string, d: DocData): LibraryItem | null {
  const name = str(d.name).trim();
  if (!name) return null;
  return {
    id: `pat_${id}`,
    group: 'Patterns',
    kind: 'Tech Pack',
    name,
    meta: [str(d.styleNo).trim(), str(d.product_type).trim(), str(d.category).trim()].filter(Boolean).join(' · '),
    tags: [],
  };
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  const [fabrics, processes, patterns] = await Promise.all([
    readCollection('fabrics', mapFabricDoc),
    readCollection('processes', mapProcessDoc),
    readCollection('patterns', mapPatternDoc),
  ]);
  return [...fabrics, ...processes, ...patterns];
}

/** No live per-item ledger — `inventory` has no movements collection (§6). */
export async function fetchMovements(): Promise<StockMovement[]> {
  return [];
}
