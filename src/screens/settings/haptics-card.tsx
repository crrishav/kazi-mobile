import { View, StyleSheet } from 'react-native';

import { Switch } from '@/components/ui/switch';
import { setHapticsEnabled, useHapticsEnabled } from '@/lib/haptics';

import { SettingRow } from './setting-row';

/**
 * The single haptics switch.
 *
 * It exists because the feature is hardware-dependent in a way the other
 * preferences are not: the same call that lands as a crisp tick on one phone is
 * a dull buzz on another, and there is no way to tell from here which one
 * somebody is holding. Anyone whose device gets the buzz should be able to turn
 * it off here rather than at the OS level, where it would also cost them the
 * keyboard and everything else.
 */
export function HapticsCard() {
  const enabled = useHapticsEnabled();

  return (
    <SettingRow
      label="Haptics"
      meta={
        enabled
          ? 'A short tap when a swipe arms, a clock-in lands, or something is deleted'
          : 'Off — the app gives feedback on screen only'
      }
    >
      <View style={styles.row}>
        <Switch value={enabled} onValueChange={() => setHapticsEnabled(!enabled)} />
      </View>
    </SettingRow>
  );
}

const styles = StyleSheet.create({
  // The other cards fill the width with a segmented control; a lone switch
  // reads better pushed to the end of the row than stretched across it.
  row: { alignItems: 'flex-start' },
});
