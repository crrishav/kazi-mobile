import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { fontFamily, tabularNums } from '@/theme';

export interface SlipLineItem {
  label: string;
  note: string;
  value: string;
}

export interface SlipData {
  fileName: string;
  meta: string;
  ref: string;
  period: string;
  employeeName: string;
  employeeBlock: string;
  paymentBlock: string;
  earnings: SlipLineItem[];
  deductions: SlipLineItem[];
  gross: string;
  totalDeductions: string;
  net: string;
  words: string;
  footNote: string;
}

export interface SalarySlipProps {
  visible: boolean;
  slip: SlipData | null;
  onClose: () => void;
  onEmail: () => void;
  onDownload: () => void;
}

/** A document, not a screen: full-bleed dark backdrop, white paper, literal hex — must look identical regardless of app theme. */
export function SalarySlip({ visible, slip, onClose, onEmail, onDownload }: SalarySlipProps) {
  const insets = useSafeAreaInsets();
  if (!visible || !slip) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)} style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {slip.fileName}
            </Text>
            <Text style={styles.headerMeta}>{slip.meta}</Text>
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
                  Balaju Industrial District, Kathmandu 44600, Nepal{'\n'}PAN 601234567 · SSF employer 09-1188-4471
                </Text>
              </View>
              <View style={styles.docHeaderRight}>
                <Text style={styles.taxLabel}>Salary slip</Text>
                <Text style={[styles.docRef, tabularNums]}>{slip.ref}</Text>
                <Text style={[styles.docPeriod, tabularNums]}>{slip.period}</Text>
              </View>
            </View>

            <View style={styles.hairline} />

            <View style={styles.detailRow}>
              <View style={[styles.gap4, styles.flex1]}>
                <Text style={styles.miniLabel}>Employee</Text>
                <Text style={styles.empName}>{slip.employeeName}</Text>
                <Text style={styles.empBlock}>{slip.employeeBlock}</Text>
              </View>
              <View style={[styles.gap4, styles.flex1]}>
                <Text style={styles.miniLabel}>Payment</Text>
                <Text style={styles.payBlock}>{slip.paymentBlock}</Text>
              </View>
            </View>

            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Earnings</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>NPR</Text>
              </View>
              {slip.earnings.map((e, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.descCol, styles.gap2]}>
                    <Text style={styles.lineLabel}>{e.label}</Text>
                    <Text style={styles.lineNote}>{e.note}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.amountCol, tabularNums]}>{e.value}</Text>
                </View>
              ))}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Gross earnings</Text>
                <Text style={[styles.subtotalValue, styles.amountCol, tabularNums]}>{slip.gross}</Text>
              </View>
            </View>

            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.descCol]}>Deductions</Text>
                <Text style={[styles.tableHeaderText, styles.amountCol]}>NPR</Text>
              </View>
              {slip.deductions.map((d, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.descCol, styles.gap2]}>
                    <Text style={styles.lineLabel}>{d.label}</Text>
                    <Text style={styles.lineNote}>{d.note}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.amountCol, tabularNums]}>{d.value}</Text>
                </View>
              ))}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Total deductions</Text>
                <Text style={[styles.subtotalValue, styles.amountCol, tabularNums]}>{slip.totalDeductions}</Text>
              </View>
            </View>

            <View style={styles.netRow}>
              <Text style={styles.netLabel}>Net pay</Text>
              <Text style={[styles.netValue, tabularNums]}>{slip.net}</Text>
            </View>

            <View style={styles.wordsBlock}>
              <Text style={styles.miniLabel}>Amount in words</Text>
              <Text style={styles.wordsText}>{slip.words}</Text>
            </View>

            <View style={styles.footNoteBox}>
              <Text style={styles.footNoteText}>{slip.footNote}</Text>
            </View>

            <View style={styles.signRow}>
              <Text style={styles.preparedText}>Prepared by K. Adhikari · HR & payroll{'\n'}Computer-generated · no stamp required</Text>
              <View style={styles.signCol}>
                <View style={styles.signLine} />
                <Text style={styles.signLabel}>Authorised signature</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.actionsBar, { paddingBottom: Math.max(20, insets.bottom + 8) }]}>
          <Pressable onPress={onEmail} style={styles.emailButton}>
            <Text style={styles.emailLabel}>Send to employee</Text>
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
  paper: { backgroundColor: '#FFFFFF', borderRadius: 6, padding: 18, gap: 15 },
  docHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  gap5: { gap: 5 },
  gap4: { gap: 4 },
  gap2: { gap: 2 },
  flex1: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandMark: { width: 20, height: 20, borderRadius: 7, backgroundColor: '#0D1F19', alignItems: 'center', justifyContent: 'center' },
  brandDot: { width: 7, height: 7, borderRadius: 2, backgroundColor: '#5FD2A0' },
  brandName: { fontSize: 11.5, fontWeight: '600', letterSpacing: -0.01 * 11.5, color: '#0F241D' },
  brandAddress: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.7, color: '#5B6C64' },
  docHeaderRight: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  taxLabel: { fontFamily: fontFamily.mono, fontSize: 9, letterSpacing: 0.16 * 9, textTransform: 'uppercase', color: '#0F241D', fontWeight: '500' },
  docRef: { fontFamily: fontFamily.mono, fontSize: 11, color: '#0F241D' },
  docPeriod: { fontFamily: fontFamily.mono, fontSize: 8.5, color: '#5B6C64' },
  hairline: { height: 1, backgroundColor: '#E6E1D5' },
  detailRow: { flexDirection: 'row', gap: 16 },
  miniLabel: { fontFamily: fontFamily.mono, fontSize: 8, letterSpacing: 0.14 * 8, textTransform: 'uppercase', color: '#8C9A92' },
  empName: { fontSize: 11, fontWeight: '600', color: '#0F241D' },
  empBlock: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.7, color: '#5B6C64' },
  payBlock: { fontFamily: fontFamily.mono, fontSize: 9, lineHeight: 9 * 1.75, color: '#3B4F47' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#0F241D' },
  tableHeaderText: { fontFamily: fontFamily.mono, fontSize: 8, letterSpacing: 0.12 * 8, textTransform: 'uppercase', color: '#0F241D' },
  descCol: { flex: 1 },
  amountCol: { width: 66, textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1EEE5' },
  lineLabel: { fontSize: 9.5, lineHeight: 9.5 * 1.35, color: '#0F241D' },
  lineNote: { fontFamily: fontFamily.mono, fontSize: 8, color: '#8C9A92' },
  tableCell: { fontFamily: fontFamily.mono, fontSize: 9.5, color: '#0F241D' },
  subtotalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  subtotalLabel: { flex: 1, fontSize: 9.5, fontWeight: '600', color: '#0F241D' },
  subtotalValue: { fontFamily: fontFamily.mono, fontSize: 10, color: '#0F241D' },
  netRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#0F241D', paddingVertical: 11 },
  netLabel: { flex: 1, fontSize: 11, fontWeight: '600', letterSpacing: -0.01 * 11, color: '#0F241D' },
  netValue: { fontFamily: fontFamily.mono, fontSize: 14, fontWeight: '500', color: '#0F241D' },
  wordsBlock: { gap: 3 },
  wordsText: { fontSize: 9.5, lineHeight: 9.5 * 1.5, color: '#3B4F47' },
  footNoteBox: { backgroundColor: '#FBF9F3', borderRadius: 4, padding: 11 },
  footNoteText: { fontFamily: fontFamily.mono, fontSize: 8.5, lineHeight: 8.5 * 1.85, color: '#5B6C64' },
  signRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, paddingTop: 4 },
  preparedText: { fontFamily: fontFamily.mono, fontSize: 8, lineHeight: 8 * 1.8, color: '#8C9A92' },
  signCol: { alignItems: 'center', gap: 5 },
  signLine: { width: 104, height: 1, backgroundColor: '#C9D2CC' },
  signLabel: { fontFamily: fontFamily.mono, fontSize: 8, color: '#8C9A92' },
  actionsBar: { flexDirection: 'row', gap: 9, borderTopWidth: 1, borderTopColor: '#23372E', backgroundColor: '#0D1F19', paddingHorizontal: 20, paddingTop: 14 },
  emailButton: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#2C4238', alignItems: 'center', justifyContent: 'center' },
  emailLabel: { fontSize: 14, fontWeight: '600', color: '#E9F1EC' },
  downloadButton: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#6FDDA9', alignItems: 'center', justifyContent: 'center' },
  downloadLabel: { fontSize: 14, fontWeight: '600', color: '#08251A' },
});
