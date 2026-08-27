/**
 * Salary-slip PDF (plan 2.5 / item 28) — same IRD/SSF letterhead as the
 * on-screen `SalarySlip` modal, rendered to a real file with `expo-print`
 * and handed to the OS share sheet via `expo-sharing`.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { SlipData } from '@/screens/employees-hr/salary-slip';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const nl = (s: string) => esc(s).replace(/\n/g, '<br/>');

function lineRows(items: SlipData['earnings']): string {
  return items
    .map(
      (i) => `<tr>
        <td><div>${esc(i.label)}</div><div class="note">${esc(i.note)}</div></td>
        <td class="r">${esc(i.value)}</td>
      </tr>`,
    )
    .join('');
}

function slipHtml(s: SlipData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #14231d; font-size: 11px; margin: 0; padding: 32px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 15px; font-weight: 700; }
  .muted { color: #5b6c64; font-size: 9px; line-height: 1.6; }
  .doc { text-align: right; }
  .tag { letter-spacing: 2px; text-transform: uppercase; font-size: 9px; color: #0f241d; }
  .ref { font-size: 14px; font-weight: 700; margin-top: 2px; }
  hr { border: none; border-top: 1px solid #0f241d; margin: 14px 0; }
  .grid { display: flex; gap: 40px; margin-bottom: 12px; }
  .lbl { text-transform: uppercase; letter-spacing: 1px; font-size: 8px; color: #8c9a92; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { text-align: left; text-transform: uppercase; letter-spacing: 0.6px; font-size: 8px; border-bottom: 1.5px solid #0f241d; padding: 6px 4px; }
  td { padding: 6px 4px; border-bottom: 1px solid #f1eee5; vertical-align: top; }
  td.r, th.r { text-align: right; white-space: nowrap; }
  .note { color: #8c9a92; font-size: 8px; margin-top: 2px; }
  .subtotal { display: flex; justify-content: space-between; padding-top: 8px; font-weight: 700; }
  .net { display: flex; justify-content: space-between; border-top: 1.5px solid #0f241d; border-bottom: 1.5px solid #0f241d; padding: 11px 0; margin-top: 12px; font-weight: 700; font-size: 13px; }
  .words { margin-top: 12px; font-size: 10px; }
  .foot { margin-top: 16px; background: #faf8f2; padding: 10px 12px; font-size: 8.5px; color: #5b6c64; line-height: 1.8; border-radius: 3px; }
  .sign { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; }
  .sigline { border-top: 1px solid #b9c4bd; width: 150px; text-align: center; padding-top: 4px; font-size: 8px; color: #8c9a92; }
</style></head><body>
  <div class="top">
    <div>
      <div class="brand">Kazi Manufacturing Pvt. Ltd.</div>
      <div class="muted">Balaju Industrial District, Kathmandu 44600, Nepal<br/>PAN 601234567 · SSF employer 09-1188-4471</div>
    </div>
    <div class="doc">
      <div class="tag">Salary Slip</div>
      <div class="ref">${esc(s.ref)}</div>
      <div class="muted">${esc(s.period)}</div>
    </div>
  </div>
  <hr/>
  <div class="grid">
    <div style="flex:1">
      <div class="lbl">Employee</div>
      <div><strong>${esc(s.employeeName)}</strong></div>
      <div class="muted">${nl(s.employeeBlock)}</div>
    </div>
    <div style="flex:1">
      <div class="lbl">Payment</div>
      <div class="muted">${nl(s.paymentBlock)}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Earnings</th><th class="r">NPR</th></tr></thead>
    <tbody>${lineRows(s.earnings)}</tbody>
  </table>
  <div class="subtotal"><span>Gross earnings</span><span>${esc(s.gross)}</span></div>

  <table>
    <thead><tr><th>Deductions</th><th class="r">NPR</th></tr></thead>
    <tbody>${lineRows(s.deductions)}</tbody>
  </table>
  <div class="subtotal"><span>Total deductions</span><span>${esc(s.totalDeductions)}</span></div>

  <div class="net"><span>Net pay</span><span>${esc(s.net)}</span></div>
  <div class="words"><span class="lbl">Amount in words</span><br/>${esc(s.words)}</div>
  <div class="foot">${nl(s.footNote)}</div>
  <div class="sign">
    <div class="muted">Prepared by K. Adhikari · HR &amp; payroll<br/>Computer-generated · no stamp required</div>
    <div class="sigline">Authorised signature</div>
  </div>
</body></html>`;
}

export async function generateSalarySlipPdf(s: SlipData): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html: slipHtml(s), base64: false });
  return uri;
}

/** Generate + open the OS share sheet. Returns false if sharing is unavailable. */
export async function shareSalarySlipPdf(s: SlipData): Promise<boolean> {
  const uri = await generateSalarySlipPdf(s);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: s.fileName });
  return true;
}
