import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DualDate } from '@/components/ui/dual-date';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { DOC_STATUS_PILL } from '@/data/billing/mock';
import type { Challan, ChallanStatus, Quotation, QuotationStatus } from '@/data/billing/types';
import { calcTotals, money } from '@/data/billing/utils';

type AnyDoc = Challan | Quotation;

export interface DocDetailSheetProps {
  visible: boolean;
  doc: AnyDoc | null;
  kind: 'challan' | 'quotation';
  canEdit: boolean;
  onClose: () => void;
  onStatus: (status: ChallanStatus | QuotationStatus) => void;
  /** Quotations only (item 15) — open a prefilled new-invoice sheet. */
  onConvert?: () => void;
}

function isQuotation(d: AnyDoc): d is Quotation {
  return 'validUntil' in d;
}

/** Which status buttons to offer next, given the current one. */
function nextStatuses(kind: 'challan' | 'quotation', current: string): string[] {
  if (kind === 'challan') {
    const flow: Record<string, string[]> = {
      Draft: ['Dispatched', 'Cancelled'],
      Dispatched: ['Delivered', 'Cancelled'],
      Delivered: [],
      Cancelled: [],
    };
    return flow[current] ?? [];
  }
  const flow: Record<string, string[]> = {
    Draft: ['Sent', 'Cancelled'],
    Sent: ['Accepted', 'Rejected', 'Cancelled'],
    Accepted: [],
    Rejected: [],
    Cancelled: [],
  };
  return flow[current] ?? [];
}

export function DocDetailSheet({ visible, doc, kind, canEdit, onClose, onStatus, onConvert }: DocDetailSheetProps) {
  const theme = useTheme();
  if (!doc) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="">
        <View />
      </BottomSheet>
    );
  }

  const quote = isQuotation(doc);
  const cur = quote ? doc.currency : 'NPR';
  const applyVAT = false; // invoices apply VAT, not challans/quotations
  const totals = calcTotals(doc.lines, applyVAT, doc.discountMode, doc.discountPct, doc.discountFlatAmt);
  const pill = DOC_STATUS_PILL[doc.status] ?? DOC_STATUS_PILL.Draft;
  const actions = canEdit ? nextStatuses(kind, doc.status) : [];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`${doc.number} · ${doc.clientName}`} maxHeight={760}>
      <View style={styles.headRow}>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <View style={[styles.pillDot, { backgroundColor: pill.dot }]} />
          <Text style={[styles.pillLabel, { color: pill.fg }]}>{doc.status}</Text>
        </View>
        <DualDate iso={doc.date} inline size={12} />
      </View>

      {/* Client block */}
      <View style={[styles.block, { borderColor: theme.border }]}>
        {doc.clientPAN ? <DetailRow label="PAN / VAT" value={doc.clientPAN} theme={theme} /> : null}
        {doc.clientPhone ? <DetailRow label="Phone" value={doc.clientPhone} theme={theme} /> : null}
        {doc.clientAddress ? <DetailRow label="Address" value={doc.clientAddress} theme={theme} /> : null}
        {quote ? (
          <DetailRow label="Valid until" value={<DualDate iso={doc.validUntil} inline size={12} />} theme={theme} />
        ) : (
          <>
            {doc.vehicleNo ? <DetailRow label="Vehicle" value={doc.vehicleNo} theme={theme} /> : null}
            {doc.driverName ? <DetailRow label="Driver" value={doc.driverName} theme={theme} /> : null}
            {doc.routeFrom || doc.routeTo ? <DetailRow label="Route" value={`${doc.routeFrom || '—'}  →  ${doc.routeTo || '—'}`} theme={theme} /> : null}
            {doc.relatedInvoice ? <DetailRow label="Billed on" value={doc.relatedInvoice} theme={theme} /> : null}
          </>
        )}
      </View>

      {/* Lines */}
      <View style={styles.lines}>
        {doc.lines.map((l, i) => (
          <View key={i} style={[styles.lineRow, { borderBottomColor: theme.border }]}>
            <View style={styles.lineTextWrap}>
              <Text style={[styles.lineDesc, { color: theme.textPrimary }]} numberOfLines={2}>
                {l.desc || '—'}
              </Text>
              <Text style={[styles.lineMeta, tabularNums, { color: theme.textSecondary }]}>
                {l.qty.toLocaleString('en-IN')} {l.unit} × {money(cur, l.rate)}
              </Text>
            </View>
            <Text style={[styles.lineAmt, tabularNums, { color: theme.textPrimary }]}>{money(cur, l.qty * l.rate)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={[styles.totals, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        <TotalRow label="Subtotal" value={money(cur, totals.subtotal)} theme={theme} />
        {totals.discountAmt > 0 ? (
          <>
            <TotalRow label={doc.discountMode === 'pct' ? `Discount (${doc.discountPct}%)` : 'Discount'} value={`− ${money(cur, totals.discountAmt)}`} theme={theme} />
            <TotalRow label="Taxable amount" value={money(cur, totals.taxableAmt)} theme={theme} />
          </>
        ) : null}
        <View style={[styles.grandRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.grandLabel, { color: theme.textPrimary }]}>Grand total</Text>
          <Text style={[styles.grandValue, tabularNums, { color: theme.textPrimary }]}>{money(cur, totals.total)}</Text>
        </View>
        {quote ? <Text style={[styles.vatNote, { color: theme.textSecondary }]}>13% VAT added on conversion to invoice</Text> : null}
      </View>

      {quote && doc.terms ? (
        <View style={styles.termsWrap}>
          <Text style={[styles.termsLabel, { color: theme.textSecondary }]}>Terms &amp; conditions</Text>
          <Text style={[styles.termsText, { color: theme.textPrimary }]}>{doc.terms}</Text>
        </View>
      ) : null}

      {doc.note ? <Text style={[styles.note, { color: theme.textSecondary }]}>{doc.note}</Text> : null}

      {quote && doc.relatedInvoice ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>Already billed on {doc.relatedInvoice}.</Text>
      ) : null}

      {quote && canEdit && onConvert && !doc.relatedInvoice && doc.status !== 'Cancelled' && doc.status !== 'Rejected' ? (
        <Button label="Convert to invoice" variant="primary" onPress={onConvert} />
      ) : null}

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((s) => (
            <Button
              key={s}
              label={`Mark ${s}`}
              variant={s === 'Cancelled' || s === 'Rejected' ? 'dangerOutline' : 'primary'}
              size="small"
              onPress={() => onStatus(s as ChallanStatus | QuotationStatus)}
            />
          ))}
        </View>
      ) : null}
    </BottomSheet>
  );
}

function DetailRow({ label, value, theme }: { label: string; value: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.detailValue, { color: theme.textPrimary }]} numberOfLines={2}>
          {value}
        </Text>
      ) : (
        <View style={styles.detailValueSlot}>{value}</View>
      )}
    </View>
  );
}

function TotalRow({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.totalValue, tabularNums, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 999 },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  block: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  detailRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.08 * 10, textTransform: 'uppercase', width: 76, flexShrink: 0 },
  detailValue: { flex: 1, fontSize: 12.5 },
  detailValueSlot: { flex: 1 },
  lines: { gap: 0 },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  lineTextWrap: { flex: 1, gap: 2, minWidth: 0 },
  lineDesc: { fontSize: 13, fontWeight: '500' },
  lineMeta: { fontFamily: fontFamily.mono, fontSize: 10 },
  lineAmt: { fontSize: 12.5, fontWeight: '600', flexShrink: 0 },
  totals: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fontFamily.mono, fontSize: 10.5, letterSpacing: 0.08 * 10.5, textTransform: 'uppercase' },
  totalValue: { fontSize: 13, fontWeight: '600' },
  grandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1.5, paddingTop: 10, marginTop: 2 },
  grandLabel: { fontFamily: fontFamily.semibold, fontSize: 14 },
  grandValue: { fontSize: 15, fontWeight: '700' },
  vatNote: { fontSize: 10.5, fontStyle: 'italic' },
  termsWrap: { gap: 5 },
  termsLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.08 * 10, textTransform: 'uppercase' },
  termsText: { fontSize: 12, lineHeight: 12 * 1.5 },
  note: { fontSize: 12, fontStyle: 'italic', lineHeight: 12 * 1.45 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
