import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { fontFamily, tabularNums } from '@/theme';
import { CLIENTS, VAT_RATE } from '@/data/billing/mock';
import type { Invoice } from '@/data/billing/types';
import { money, n0, n2, npr, subtotal, total, vat } from '@/data/billing/utils';

export interface PdfPreviewProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export function PdfPreview({ visible, invoice: v, onClose, onShare, onDownload }: PdfPreviewProps) {
  const insets = useSafeAreaInsets();
  if (!visible || !v) return null;

  const client = CLIENTS[v.client];
  const footNote = v.export
    ? `Zero-rated export supply under Nepal VAT Act, Sch. 2. Invoiced in ${v.cur} at ${n2(v.rate)} NPR/${v.cur} on ${v.issued} 2026. Goods delivered under challan ${v.challans.map((c) => c.no).join(', ')} against ${v.so}.`
    : `VAT ${VAT_RATE}% charged on the taxable value above. Goods delivered under challan ${v.challans.map((c) => c.no).join(', ')} against ${v.so}. Payable on presentation.`;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{v.ref}.pdf</Text>
            <Text style={styles.headerMeta}>
              Preview · {v.export ? 'zero-rated export' : `VAT ${VAT_RATE}%`} · A4
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={16} color="#E9F1EC" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.paper}>
            <View style={styles.docHeaderRow}>
              <View style={styles.gap5}>
                <View style={styles.brandRow}>
                  <View style={styles.brandMark}>
                    <View style={styles.brandDot} />
                  </View>
                  <Text style={styles.brandName}>Kazi Manufacturing Pvt. Ltd.</Text>
                </View>
                <Text style={styles.brandAddress}>
                  Balaju Industrial District, Kathmandu 44600, Nepal{'\n'}PAN 601234567 · VAT registered
                </Text>
              </View>
              <View style={styles.docHeaderRight}>
                <Text style={styles.taxInvoice}>Tax invoice</Text>
                <Text style={[styles.docRef, tabularNums]}>{v.ref}</Text>
                <Text style={[styles.docDates, tabularNums]}>
                  Issued {v.issued} 2026 · due {v.due} 2026
                </Text>
              </View>
            </View>

            <View style={styles.hairline} />

            <View style={styles.billRow}>
              <View style={styles.gap4}>
                <Text style={styles.miniLabel}>Bill to</Text>
                <Text style={styles.billName}>{client.name}</Text>
                <Text style={styles.billCity}>{client.city}</Text>
              </View>
              <View style={styles.gap4}>
                <Text style={styles.miniLabel}>Reference</Text>
                <Text style={[styles.refBlock, tabularNums]}>
                  {v.so}
                  {'\n'}
                  {v.challans.map((c) => c.no).join(', ')}
                  {'\n'}Terms · {v.terms}
                </Text>
              </View>
            </View>

            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.qtyCol]}>Qty</Text>
                <Text style={[styles.tableHeaderText, styles.rateCol]}>Rate</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>Amount</Text>
              </View>
              {v.lines.map((l, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.descCol, styles.gap2]}>
                    <Text style={styles.lineDesc}>{l.desc}</Text>
                    <Text style={styles.lineChallan}>{l.challan}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.qtyCol, tabularNums]}>{n0(l.qty)}</Text>
                  <Text style={[styles.tableCell, styles.rateCol, tabularNums]}>{n2(l.rate)}</Text>
                  <Text style={[styles.tableCell, styles.amountCol, tabularNums]}>{n2(l.qty * l.rate)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalsWrap}>
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Subtotal</Text>
                  <Text style={[styles.totalsValue, tabularNums]}>{n2(subtotal(v))}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{v.export ? 'VAT · zero-rated export' : `VAT ${VAT_RATE}%`}</Text>
                  <Text style={[styles.totalsValue, tabularNums]}>{v.export ? '—' : n2(vat(v))}</Text>
                </View>
                <View style={styles.grandRow}>
                  <Text style={styles.grandLabel}>Total due</Text>
                  <Text style={[styles.grandValue, tabularNums]}>{money(v.cur, total(v))}</Text>
                </View>
                {v.cur !== 'NPR' ? (
                  <View style={styles.totalsRow}>
                    <Text style={styles.nprLabel}>NPR equivalent</Text>
                    <Text style={[styles.nprValue, tabularNums]}>{npr(total(v) * v.rate)}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.footNoteBox}>
              <Text style={styles.footNoteText}>{footNote}</Text>
            </View>

            <View style={styles.signRow}>
              <Text style={styles.bankText}>Bank · NIC Asia 8830-0119-2245{'\n'}SWIFT NICENPKA · Kathmandu</Text>
              <View style={styles.signCol}>
                <View style={styles.signLine} />
                <Text style={styles.signLabel}>Authorised signature</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.actionsBar, { paddingBottom: Math.max(20, insets.bottom + 8) }]}>
          <Pressable onPress={onShare} style={styles.emailButton}>
            <Text style={styles.emailLabel}>Email to client</Text>
          </Pressable>
          <Pressable onPress={onDownload} style={styles.downloadButton}>
            <Text style={styles.downloadLabel}>Download</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1512' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  headerTextWrap: { flex: 1, gap: 2, minWidth: 0 },
  headerTitle: { fontFamily: fontFamily.semibold, fontSize: 16, letterSpacing: -0.015 * 16, color: '#E9F1EC' },
  headerMeta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, textTransform: 'uppercase', color: '#7E958A' },
  closeButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: '#23372E', backgroundColor: '#10201A', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  paper: { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 18, gap: 16 },
  docHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  gap4: { gap: 4 },
  gap2: { gap: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandMark: { width: 20, height: 20, borderRadius: 7, backgroundColor: '#0D1F19', alignItems: 'center', justifyContent: 'center' },
  brandDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: '#5FD2A0' },
  brandName: { fontSize: 11.5, fontWeight: '600', letterSpacing: -0.01 * 11.5, color: '#0F241D' },
  brandAddress: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.7, color: '#5B6C64' },
  docHeaderRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  taxInvoice: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.16 * 9, textTransform: 'uppercase', color: '#0F241D', fontWeight: '500' },
  docRef: { fontFamily: fontFamily.mono, fontSize: 11, color: '#0F241D' },
  docDates: { fontFamily: fontFamily.mono, fontSize: 8.5, color: '#5B6C64' },
  hairline: { height: 1, backgroundColor: '#E6E1D5' },
  billRow: { flexDirection: 'row', gap: 16 },
  miniLabel: { fontFamily: fontFamily.mono, fontSize: 8, letterSpacing: 0.14 * 8, textTransform: 'uppercase', color: '#8C9A92' },
  billName: { fontSize: 11, fontWeight: '600', color: '#0F241D' },
  billCity: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.6, color: '#5B6C64' },
  refBlock: { fontFamily: fontFamily.mono, fontSize: 9, lineHeight: 9 * 1.7, color: '#3B4F47' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#0F241D' },
  tableHeaderText: { fontFamily: fontFamily.mono, fontSize: 8, letterSpacing: 0.12 * 8, textTransform: 'uppercase', color: '#0F241D' },
  descCol: { flex: 1 },
  qtyCol: { width: 34, textAlign: 'right' },
  rateCol: { width: 42, textAlign: 'right' },
  amountCol: { width: 56, textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1EEE5' },
  lineDesc: { fontSize: 9.5, lineHeight: 9.5 * 1.35, color: '#0F241D' },
  lineChallan: { fontFamily: fontFamily.mono, fontSize: 8, color: '#8C9A92' },
  tableCell: { fontFamily: fontFamily.mono, fontSize: 9, color: '#3B4F47' },
  totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end' },
  totalsBox: { width: 190, gap: 6 },
  totalsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalsLabel: { flex: 1, fontSize: 9.5, color: '#5B6C64' },
  totalsValue: { fontFamily: fontFamily.mono, fontSize: 9.5, color: '#3B4F47' },
  grandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#0F241D' },
  grandLabel: { flex: 1, fontSize: 10, fontWeight: '600', color: '#0F241D' },
  grandValue: { fontFamily: fontFamily.mono, fontSize: 11, fontWeight: '500', color: '#0F241D' },
  nprLabel: { flex: 1, fontFamily: fontFamily.mono, fontSize: 8.5, color: '#8C9A92' },
  nprValue: { fontFamily: fontFamily.mono, fontSize: 9, color: '#5B6C64' },
  footNoteBox: { backgroundColor: '#FBF9F3', borderRadius: 4, padding: 11 },
  footNoteText: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.85, color: '#5B6C64' },
  signRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, paddingTop: 6 },
  bankText: { fontFamily: fontFamily.mono, fontSize: 8, lineHeight: 8 * 1.8, color: '#8C9A92' },
  signCol: { alignItems: 'center', gap: 5 },
  signLine: { width: 110, height: 1, backgroundColor: '#C9D2CC' },
  signLabel: { fontFamily: fontFamily.mono, fontSize: 8, color: '#8C9A92' },
  actionsBar: { flexDirection: 'row', gap: 9, borderTopWidth: 1, borderTopColor: '#23372E', backgroundColor: '#0D1F19', paddingHorizontal: 20, paddingTop: 14 },
  emailButton: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#2C4238', alignItems: 'center', justifyContent: 'center' },
  emailLabel: { fontSize: 14, fontWeight: '600', color: '#E9F1EC' },
  downloadButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#6FDDA9', alignItems: 'center', justifyContent: 'center' },
  downloadLabel: { fontSize: 14, fontWeight: '600', color: '#08251A' },
});
