import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { formatAD, formatBS, type BSFormat } from '@/lib/nepaliDate';
import { useTheme } from '@/theme/theme-provider';
import { tabularNums } from '@/theme';

export interface DualDateProps {
  /** The canonical stored date: an AD ISO string, `YYYY-MM-DD`. */
  iso: string;
  /** BS rendering style for the primary line. Default `long` (`10 Bhadra 2083`). */
  bsStyle?: BSFormat;
  /** Hide the muted AD secondary line. */
  secondary?: boolean;
  /** ` · ` separator on one line instead of stacked. */
  inline?: boolean;
  /** Primary font size; secondary scales to ~0.78 of it. Default 13. */
  size?: number;
  onDark?: boolean;
  align?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  primaryStyle?: StyleProp<TextStyle>;
}

/**
 * Canonical date display: Bikram Sambat primary with the Gregorian date
 * muted alongside — the reference app renders dates this way across Billing,
 * Finance, Attendance and the Dashboard.
 */
export function DualDate({
  iso,
  bsStyle = 'long',
  secondary = true,
  inline = false,
  size = 13,
  onDark = false,
  align = 'left',
  style,
  primaryStyle,
}: DualDateProps) {
  const theme = useTheme();
  const primaryColor = onDark ? theme.onDark.text : theme.textPrimary;
  const secondaryColor = onDark ? theme.onDark.textMuted : theme.textSecondary;

  const bs = formatBS(iso, bsStyle);
  const ad = formatAD(iso);

  if (inline) {
    return (
      <Text style={[tabularNums, { color: primaryColor, fontSize: size, fontWeight: '600' }, primaryStyle, style as StyleProp<TextStyle>]}>
        {bs}
        {secondary ? <Text style={{ color: secondaryColor, fontWeight: '400' }}>{`  ·  ${ad}`}</Text> : null}
      </Text>
    );
  }

  return (
    <View style={[{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }, style]}>
      <Text style={[styles.primary, tabularNums, { color: primaryColor, fontSize: size }, primaryStyle]} numberOfLines={1}>
        {bs}
      </Text>
      {secondary ? (
        <Text style={[styles.secondary, tabularNums, { color: secondaryColor, fontSize: Math.round(size * 0.78) }]} numberOfLines={1}>
          {ad}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  primary: { fontWeight: '600' },
  secondary: { fontWeight: '400', marginTop: 1 },
});
