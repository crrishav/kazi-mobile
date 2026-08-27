import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { GEOFENCE_RADIUS_M, type GeofenceEval } from '@/lib/geo';
import { TARGET_SECONDS } from '@/data/attendance/mock';
import type { PunchSummary } from '@/data/attendance/types';
import { formatHm } from '@/data/attendance/utils';

import type { GeoState } from './use-geo-clock-in';

export interface ClockCardProps {
  clockedIn: boolean;
  inTime: string;
  outTime: string | null;
  elapsedSeconds: number;
  /** Clock out, or start a GPS-verified clock-in — the parent routes on `clockedIn`. */
  onToggle: () => void;
  /** GPS acquisition state for the pending clock-in (item 26). */
  geoState: GeoState;
  /** Evaluated fix once `geoState === 'ready'`. */
  geo: GeofenceEval | null;
  /** Geofence + late-cut outcome of the current session, shown while clocked in. */
  lastPunch?: PunchSummary;
  /** Clock in despite a failed geofence / accuracy / permission gate. */
  onBypass: () => void;
}

function lateLine(p: PunchSummary): string {
  const where = p.distanceToSiteM == null ? 'no GPS logged' : `${p.distanceToSiteM} m from site`;
  const when =
    p.status === 'Present'
      ? 'on time'
      : `${p.lateMinutes} min late${p.lateCutApplied ? ' · cut applied' : ''}`;
  return `${where} · ${when}${p.bypassUsed ? ' · bypassed' : ''}`;
}

function blockedMessage(geoState: GeoState, geo: GeofenceEval | null): string | null {
  if (geoState === 'denied') return "Location is off. Turn it on so we can confirm you're at the workshop.";
  if (geoState === 'error') return "Couldn't get a GPS fix. Move to an open area and try again.";
  if (geoState === 'ready' && geo) {
    if (!geo.withinFence) return `You're ${geo.distanceM} m away — outside the ${GEOFENCE_RADIUS_M} m clock-in zone.`;
    if (!geo.accuracyOk) return `GPS fix is only accurate to ±${geo.accuracyM} m. Find a clearer spot.`;
  }
  return null;
}

export function ClockCard({ clockedIn, inTime, outTime, elapsedSeconds, onToggle, geoState, geo, lastPunch, onBypass }: ClockCardProps) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (clockedIn) {
      pulse.value = withRepeat(withSequence(withTiming(0.35, { duration: 1200, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [clockedIn, pulse]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const remain = Math.max(TARGET_SECONDS - elapsedSeconds, 0);
  const progressPct = Math.min((elapsedSeconds / TARGET_SECONDS) * 100, 100);

  const locating = !clockedIn && geoState === 'locating';
  const blocked = !clockedIn ? blockedMessage(geoState, geo) : null;
  const verified = !clockedIn && geoState === 'ready' && geo && geo.withinFence && geo.accuracyOk;

  let geoCaption: string | null = null;
  if (clockedIn && lastPunch) geoCaption = lateLine(lastPunch);
  else if (locating) geoCaption = 'Checking you’re at the workshop…';
  else if (verified && geo) geoCaption = `${geo.distanceM} m from site · fix ±${geo.accuracyM} m`;

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceInverted }]}>
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Animated.View style={[styles.statusDot, { backgroundColor: clockedIn ? theme.onDark.accent : theme.onDark.textMuted }, dotStyle]} />
          <Text style={[styles.statusLabel, { color: theme.onDark.textMuted }]}>{clockedIn ? `Clocked in · since ${inTime}` : `Clocked out · ${outTime}`}</Text>
        </View>
        <Text style={[styles.gateLabel, tabularNums, { color: theme.onDark.textMuted }]}>Gate 2 · KTM</Text>
      </View>

      <View style={styles.hoursRow}>
        <View style={styles.gap6}>
          <Text style={[styles.hoursValue, tabularNums, { color: theme.onDark.text }]}>{formatHm(elapsedSeconds)}</Text>
          <Text style={[styles.hoursCaption, { color: theme.onDark.textMuted }]}>worked today · target 8h 00m</Text>
        </View>
        <View style={styles.inOutCol}>
          <Text style={[styles.inOutLabel, { color: theme.onDark.textMuted }]}>In</Text>
          <Text style={[styles.inOutValue, tabularNums, { color: theme.onDark.text }]}>{inTime}</Text>
          <Text style={[styles.inOutLabel, styles.outLabelSpacing, { color: theme.onDark.textMuted }]}>Out</Text>
          <Text style={[styles.inOutValue, tabularNums, { color: theme.onDark.text }]}>{outTime ?? '—'}</Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: 'rgba(233,241,236,0.16)' }]}>
          <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: theme.onDark.accent }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressCaption, tabularNums, { color: theme.onDark.textMuted }]}>Break 12:30–13:00 taken</Text>
          <Text style={[styles.progressCaption, tabularNums, { color: theme.onDark.textMuted }]}>
            {remain === 0 ? 'Target met' : `${Math.floor(remain / 3600)}h ${String(Math.floor((remain % 3600) / 60)).padStart(2, '0')}m to target`}
          </Text>
        </View>
      </View>

      {geoCaption ? (
        <View style={styles.geoRow}>
          {locating ? <ActivityIndicator size="small" color={theme.onDark.textMuted} /> : null}
          <Text style={[styles.geoCaption, { color: theme.onDark.textMuted }]}>{geoCaption}</Text>
        </View>
      ) : null}

      {blocked ? (
        <View style={[styles.blockedBox, { backgroundColor: theme.onDark.warningWash }]}>
          <Text style={[styles.blockedText, { color: theme.onDark.warningWashText }]}>{blocked}</Text>
          <Pressable onPress={onBypass} hitSlop={8}>
            <Text style={[styles.bypassLink, { color: theme.onDark.accent }]}>Clock in anyway</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onToggle}
        disabled={locating}
        style={[styles.clockButton, { backgroundColor: clockedIn ? '#16281F' : theme.onDark.accent, opacity: locating ? 0.6 : 1 }]}
      >
        <Text style={[styles.clockButtonLabel, { color: clockedIn ? theme.onDark.text : theme.accentText }]}>
          {clockedIn ? 'Clock Out' : locating ? 'Locating…' : 'Clock In'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 20, gap: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 99 },
  statusLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.14 * 10, textTransform: 'uppercase' },
  gateLabel: { fontFamily: fontFamily.mono, fontSize: 11 },
  hoursRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  gap6: { gap: 6 },
  hoursValue: { fontSize: 44, fontWeight: '600', letterSpacing: -0.03 * 44, lineHeight: 44 },
  hoursCaption: { fontSize: 13 },
  inOutCol: { alignItems: 'flex-end', gap: 4 },
  inOutLabel: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  inOutValue: { fontSize: 17, fontWeight: '600' },
  outLabelSpacing: { paddingTop: 4 },
  progressWrap: { gap: 7 },
  progressTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressCaption: { fontFamily: fontFamily.mono, fontSize: 10 },
  geoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  geoCaption: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase', flexShrink: 1 },
  blockedBox: { borderRadius: 14, padding: 14, gap: 8 },
  blockedText: { fontSize: 13, lineHeight: 18 },
  bypassLink: { fontFamily: fontFamily.semibold, fontSize: 13 },
  clockButton: { height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  clockButtonLabel: { fontFamily: fontFamily.semibold, fontSize: 16 },
});
