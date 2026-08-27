/**
 * IRD-format tax invoice → PDF (plan 2.5 / item 16). Builds a self-contained
 * HTML string and rasterises it with `expo-print`; `shareInvoicePdf` then hands
 * the file to the OS share sheet via `expo-sharing`.
 *
 * Mock-era: seller letterhead + PAN are constants here (no company-settings
 * screen yet). Numbering stays global gap-free (`nextDocNumber`) — per-fiscal-
 * year counters are `NEPAL_COMPLIANCE_PLAN` Phase 2 / item 39.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { fiscalYearForAD, formatAD, formatBS } from '@/lib/nepaliDate';
import { CLIENTS, VAT_RATE } from '@/data/billing/mock';
import type { Invoice } from '@/data/billing/types';
import { appliesVAT, discountAmt, n2, subtotal, taxable, total, vat } from '@/data/billing/utils';

const SELLER = {
  name: 'Kazi Manufacturing Pvt. Ltd.',
  address: 'Balaju Industrial District, Kathmandu 44600, Nepal',
  pan: '601234567',
  bank: 'NIC Asia 8830-0119-2245 · SWIFT NICENPKA',
};

export interface InvoicePdfOptions {
  /** IRD reprint counter — 1 = original, 2+ prints as "Copy of Original — N". */
  copyNumber?: number;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

/** Indian-system amount in words (Lakh / Crore), for the NPR total. */
export function amountInWords(value: number): string {
  const rupees = Math.floor(value);
  const paisa = Math.round((value - rupees) * 100);
  if (rupees === 0) return paisa ? `Paisa ${twoDigits(paisa)} only` : 'Zero only';

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = Math.floor((rupees % 1000) / 100);
  const rest = rupees % 100;
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  let words = `Rupees ${parts.join(' ')}`;
  if (paisa) words += ` and Paisa ${twoDigits(paisa)}`;
  return `${words} only`;
}

function invoiceHtml(v: Invoice, opts: InvoicePdfOptions): string {
  const client = CLIENTS[v.client];
  const buyerName = v.clientName ?? client.name;
  const buyerAddress = v.clientAddress ?? client.city;
  const fy = v.issuedISO ? fiscalYearForAD(v.issuedISO).label : '2082/83';
  const issued = v.issuedISO ? `${formatBS(v.issuedISO, 'long')} BS · ${formatAD(v.issuedISO)}` : `${esc(v.issued)} 2026`;
  const due = v.dueISO ? `${formatBS(v.dueISO, 'long')} BS · ${formatAD(v.dueISO)}` : `${esc(v.due)} 2026`;
  const vatApplies = appliesVAT(v);
  const disc = discountAmt(v);
  const copyN = opts.copyNumber ?? 1;

  const rows = v.lines
    .map((l, i) => {
      const amt = l.qty * l.rate;
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(l.desc)}${l.challan ? `<div class="sub">${esc(l.challan)}</div>` : ''}</td>
        <td class="r">${l.qty.toLocaleString('en-IN')}</td>
        <td class="c">${esc(l.unit ?? 'Pcs')}</td>
        <td class="r">${n2(l.rate)}</td>
        <td class="r">${n2(amt)}</td>
      </tr>`;
    })
    .join('');

  const totalNPR = v.cur === 'NPR' ? total(v) : total(v) * v.rate;

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #14231d; font-size: 11px; margin: 0; padding: 32px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 15px; font-weight: 700; }
  .muted { color: #5b6c64; font-size: 9.5px; line-height: 1.6; }
  .doc { text-align: right; }
  .tag { letter-spacing: 2px; text-transform: uppercase; font-size: 9px; color: #0f241d; }
  .ref { font-size: 15px; font-weight: 700; margin-top: 2px; }
  .copy { color: #8c9a92; font-size: 9px; margin-top: 2px; }
  hr { border: none; border-top: 1px solid #0f241d; margin: 14px 0; }
  .grid { display: flex; gap: 40px; margin-bottom: 14px; }
  .lbl { text-transform: uppercase; letter-spacing: 1px; font-size: 8px; color: #8c9a92; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; text-transform: uppercase; letter-spacing: 0.6px; font-size: 8px; border-bottom: 1.5px solid #0f241d; padding: 6px 4px; }
  td { padding: 7px 4px; border-bottom: 1px solid #eae4d7; vertical-align: top; }
  td.r, th.r { text-align: right; }
  td.c, th.c { text-align: center; }
  .sub { color: #8c9a92; font-size: 8px; margin-top: 2px; }
  .totals { width: 260px; margin-left: auto; margin-top: 12px; }
  .totals .row { display: flex; justify-content: space-between; padding: 3px 0; color: #3b4f47; }
  .totals .grand { border-top: 1.5px solid #0f241d; margin-top: 5px; padding-top: 7px; font-weight: 700; color: #0f241d; font-size: 12px; }
  .words { margin-top: 14px; font-size: 10px; }
  .foot { margin-top: 18px; background: #faf8f2; padding: 10px 12px; font-size: 9px; color: #5b6c64; line-height: 1.7; border-radius: 3px; }
  .sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
  .sigline { border-top: 1px solid #b9c4bd; width: 160px; text-align: center; padding-top: 4px; font-size: 8.5px; color: #8c9a92; }
</style></head><body>
  <div class="top">
    <div>
      <div class="brand">${SELLER.name}</div>
      <div class="muted">${SELLER.address}<br/>PAN ${SELLER.pan} · VAT registered</div>
    </div>
    <div class="doc">
      <div class="tag">Tax Invoice</div>
      <div class="ref">${esc(v.ref)}</div>
      <div class="copy">FY ${fy}${copyN > 1 ? ` · Copy of Original — ${copyN}` : ''}</div>
    </div>
  </div>
  <hr/>
  <div class="grid">
    <div style="flex:1">
      <div class="lbl">Bill to</div>
      <div><strong>${esc(buyerName)}</strong></div>
      <div class="muted">${esc(buyerAddress)}${v.clientPhone ? `<br/>${esc(v.clientPhone)}` : ''}</div>
      <div class="muted">Buyer PAN: ${esc(v.clientPAN || '—')}</div>
    </div>
    <div style="flex:1">
      <div class="lbl">Issue &amp; due</div>
      <div class="muted">Issued: ${issued}<br/>Due: ${due}<br/>Terms: ${esc(v.paymentTerms ?? v.terms)}<br/>Order: ${esc(v.so || '—')}</div>
    </div>
  </div>
  <table>
    <thead><tr><th class="c">#</th><th>Description</th><th class="r">Qty</th><th class="c">Unit</th><th class="r">Rate</th><th class="r">Amount (${v.cur})</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${n2(subtotal(v))}</span></div>
    ${disc > 0.5 ? `<div class="row"><span>Discount</span><span>− ${n2(disc)}</span></div><div class="row"><span>Taxable value</span><span>${n2(taxable(v))}</span></div>` : ''}
    <div class="row"><span>${vatApplies ? `VAT ${VAT_RATE}%` : 'VAT (zero-rated / export)'}</span><span>${vatApplies ? n2(vat(v)) : '—'}</span></div>
    <div class="row grand"><span>Total (${v.cur})</span><span>${n2(total(v))}</span></div>
    ${v.cur !== 'NPR' ? `<div class="row"><span>NPR equivalent @ ${n2(v.rate)}</span><span>${n2(totalNPR)}</span></div>` : ''}
  </div>
  <div class="words"><span class="lbl">Amount in words</span><br/>${esc(amountInWords(totalNPR))}</div>
  <div class="foot">
    ${vatApplies
      ? `VAT ${VAT_RATE}% charged on the taxable value shown. `
      : `Zero-rated export supply under the Nepal VAT Act, Schedule 2. Invoiced in ${v.cur} at ${n2(v.rate)} NPR. `}
    Goods delivered under ${v.challans.length ? esc(v.challans.map((c) => c.no).join(', ')) : 'this invoice'} against ${esc(v.so || 'direct order')}.
    Remit to ${SELLER.bank}.
  </div>
  <div class="sign">
    <div class="muted">This is a computer-generated tax invoice.</div>
    <div class="sigline">Authorised signature</div>
  </div>
</body></html>`;
}

/** Rasterise the invoice to a temp PDF and return its file URI. */
export async function generateInvoicePdf(v: Invoice, opts: InvoicePdfOptions = {}): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: invoiceHtml(v, opts), base64: false });
  return uri;
}

/** Generate + open the OS share sheet. Returns false if sharing is unavailable. */
export async function shareInvoicePdf(v: Invoice, opts: InvoicePdfOptions = {}): Promise<boolean> {
  const uri = await generateInvoicePdf(v, opts);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `${v.ref} — tax invoice`,
  });
  return true;
}
