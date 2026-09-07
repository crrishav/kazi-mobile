/**
 * Live inventory readers. The reference page is one screen over eight tables;
 * mobile reads five of them.
 *
 * Live shapes (compat views, sampled 2026-09-07):
 *   inventory      { itemId ("#kazi1009"), item, category, unit, supplier, location,
 *                    openingStock, stockIn, stockUsed, minLevel, unitCostNPR, owner,
 *                    condition, sizeRows, damageLog, lastUpdated, createdBy, createdAt }
 *   fabrics        { name, type, composition, supplier, gsm, weight, price_per_meter,
 *                    pricePerKg, available_colors[], status, notes, swatchImageUrl }
 *   processes      { name, category, description, notes, cost_per_unit,
 *                    lead_time_days, min_quantity }
 *   patterns       { styleNo, name, product_type, category, season, market, designerName,
 *                    sizes_available[], specSize, specDate, trims, washCare, remarks,
 *                    notes, measurements, fabricRows, frontSketchUrl, backSketchUrl,
 *                    tech_pack_url, tech_pack_images[] }
 *   product_costs  { code, name, fabric, labour, rib, trims, others, total }
 *
 * Image fields are public Supabase Storage URLs now, not the base64 blobs the
 * pre-migration data held, so they are read and rendered directly.
 *
 * Not read, on purpose:
 *   - `stock_movements` — 0 live rows and no writer; `fetchMovements` returns [].
 *   - `samples` — 0 live rows; the tab is not built (see the module README note).
 *   - `unit_economics` — every live row is orphaned by the migration; the same
 *     figures come from `product_costs` keyed by code. See `ItemCost`.
 */

import { num, str } from '@/lib/data/normalise';
import { readCollection, type DocData } from '@/lib/supabase/read';

import type {
  Fabric,
  ItemCost,
  Process,
  StockItem,
  StockMovement,
  TechPack,
  TechPackFabric,
  TechPackMeasurement,
} from './types';

/** Postgres numerics arrive as strings through PostgREST; `num` handles both. */
function strList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x).trim()).filter(Boolean);
}

function isoDate(v: unknown): string {
  const s = str(v).trim();
  return s ? s.slice(0, 10) : '';
}

function mapStockDoc(id: string, d: DocData): StockItem | null {
  const name = str(d.item).trim();
  if (!name) return null;
  const category = str(d.category).trim();
  const cost = num(d.unitCostNPR);
  const opening = num(d.openingStock);
  const stockIn = num(d.stockIn);
  const stockUsed = num(d.stockUsed);
  return {
    id,
    name,
    sku: str(d.itemId).trim(),
    supplier: str(d.supplier).trim(),
    category,
    // The reference computes the balance as opening + in − out on every row it
    // renders. Reading `openingStock` alone was mobile's old bug: invisible
    // while every live row has in = out = 0, and silently wrong the moment one
    // does not.
    qty: opening + stockIn - stockUsed,
    opening,
    stockIn,
    stockUsed,
    threshold: num(d.minLevel),
    unit: str(d.unit).trim() || 'pcs',
    swatch: '#EDEFEC',
    swatchFg: '#3B4F47',
    swatchLabel: (category || name).slice(0, 3).toUpperCase(),
    lead: '',
    location: str(d.location).trim(),
    cost: cost ? `रु ${cost.toLocaleString('en-US')}` : '',
    unitCostNPR: cost,
    owner: str(d.owner).trim(),
    condition: str(d.condition).trim(),
    lastUpdated: isoDate(d.lastUpdated),
    batches: '',
  };
}

export async function fetchStock(): Promise<StockItem[]> {
  return readCollection('inventory', mapStockDoc);
}

function mapFabricDoc(id: string, d: DocData): Fabric | null {
  const name = str(d.name).trim();
  if (!name) return null;
  return {
    id,
    name,
    type: str(d.type).trim(),
    composition: str(d.composition).trim(),
    supplier: str(d.supplier).trim(),
    gsm: num(d.gsm),
    weight: str(d.weight).trim(),
    pricePerMeter: num(d.price_per_meter),
    pricePerKg: num(d.pricePerKg),
    colors: strList(d.available_colors),
    status: str(d.status).trim(),
    notes: str(d.notes).trim(),
    swatchUrl: str(d.swatchImageUrl).trim(),
  };
}

export async function fetchFabrics(): Promise<Fabric[]> {
  const rows = await readCollection('fabrics', mapFabricDoc);
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function mapProcessDoc(id: string, d: DocData): Process | null {
  const name = str(d.name).trim();
  if (!name) return null;
  return {
    id,
    name,
    category: str(d.category).trim(),
    description: str(d.description).trim(),
    notes: str(d.notes).trim(),
    costPerUnit: num(d.cost_per_unit),
    leadTimeDays: num(d.lead_time_days),
    minQuantity: num(d.min_quantity),
  };
}

export async function fetchProcesses(): Promise<Process[]> {
  const rows = await readCollection('processes', mapProcessDoc);
  // Dearest step first: the list doubles as a price list, and what a job costs
  // is the reason anyone opens it.
  return rows.sort((a, b) => b.costPerUnit - a.costPerUnit);
}

function mapFabricRows(v: unknown): TechPackFabric[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => {
      const row = (r ?? {}) as DocData;
      return { fabricName: str(row.fabricName).trim(), description: str(row.description).trim() };
    })
    .filter((r) => r.fabricName || r.description);
}

function mapMeasurements(v: unknown): TechPackMeasurement[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => {
      const row = (r ?? {}) as DocData;
      return { label: str(row.label).trim(), inch: str(row.inch).trim() };
    })
    .filter((m) => m.label || m.inch);
}

function mapPatternDoc(id: string, d: DocData): TechPack | null {
  const name = str(d.name).trim();
  if (!name) return null;
  return {
    id,
    styleNo: str(d.styleNo).trim(),
    name,
    productType: str(d.product_type).trim(),
    category: str(d.category).trim(),
    season: str(d.season).trim(),
    market: str(d.market).trim(),
    designer: str(d.designerName).trim(),
    sizes: strList(d.sizes_available),
    specSize: str(d.specSize).trim(),
    specDate: isoDate(d.specDate),
    trims: str(d.trims).trim(),
    washCare: str(d.washCare).trim(),
    remarks: str(d.remarks).trim(),
    notes: str(d.notes).trim(),
    fabrics: mapFabricRows(d.fabricRows),
    measurements: mapMeasurements(d.measurements),
    frontSketchUrl: str(d.frontSketchUrl).trim(),
    backSketchUrl: str(d.backSketchUrl).trim(),
    techPackUrl: str(d.tech_pack_url).trim(),
    images: strList(d.tech_pack_images),
  };
}

export async function fetchTechPacks(): Promise<TechPack[]> {
  const rows = await readCollection('patterns', mapPatternDoc);
  // Newest first — a tech pack is a working document, and the one being cut
  // this week is the one someone is looking for.
  return rows.sort((a, b) => (b.specDate || '').localeCompare(a.specDate || ''));
}

function mapCostDoc(id: string, d: DocData): ItemCost | null {
  // `product_costs` is keyed by `code`, not a generated id, so the view's `id`
  // and `code` are the same value — take the explicit column and fall back.
  const code = (str(d.code).trim() || id).trim();
  if (!code) return null;
  const total = d.total === null || d.total === undefined ? null : num(d.total);
  return {
    code,
    name: str(d.name).trim(),
    fabric: num(d.fabric),
    labour: num(d.labour),
    rib: num(d.rib),
    trims: num(d.trims),
    others: num(d.others),
    total,
  };
}

export async function fetchItemCosts(): Promise<ItemCost[]> {
  const rows = await readCollection('product_costs', mapCostDoc);
  return rows.sort((a, b) => a.code.localeCompare(b.code));
}

/** No live per-item ledger — `stock_movements` has never been written to (0 rows). */
export async function fetchMovements(): Promise<StockMovement[]> {
  return [];
}
