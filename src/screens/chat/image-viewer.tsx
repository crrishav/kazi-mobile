import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { fontFamily } from '@/theme';
import type { Attachment } from '@/data/chat/types';
import { fileSize } from '@/data/chat/utils';

export interface ImageViewerProps {
  /** Null closes it. */
  attachment: Attachment | null;
  onClose: () => void;
  /** Hands the file to the OS share sheet. */
  onShare?: () => void;
}

/**
 * A photo, full-bleed on black.
 *
 * `resizeMode="contain"` rather than a pinch-zoom surface: the upload keeps
 * the long edge at 1920px, so a phone screen already shows nearly every pixel
 * there is, and a gesture layer would only add a way to leave the image
 * stranded off-centre. Anyone who needs to inspect it closely shares it out to
 * a proper viewer, which is what the share button is for.
 *
 * Its own `Modal` rather than `BottomSheet` — this is not a sheet, and the
 * chrome is deliberately just the two buttons.
 */
export function ImageViewer({ attachment, onClose, onShare }: ImageViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!attachment} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        {attachment?.url ? (
          <Image source={{ uri: attachment.url }} style={styles.image} resizeMode="contain" />
        ) : (
          <ActivityIndicator color="#FFFFFF" />
        )}

        <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.button}>
            <Icon name="x" size={19} color="#FFFFFF" />
          </Pressable>
          <View style={styles.title}>
            <Text style={styles.name} numberOfLines={1}>
              {attachment?.name ?? ''}
            </Text>
            {attachment ? <Text style={styles.meta}>{fileSize(attachment.size)}</Text> : null}
          </View>
          {onShare ? (
            <Pressable onPress={onShare} hitSlop={10} style={styles.button}>
              <Icon name="share" size={17} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// Fixed colours, not theme tokens: a photo viewer is black in both schemes,
// and every foreground here sits on the image rather than on a surface.
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05100D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(5,16,13,0.55)',
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 14, color: '#FFFFFF' },
  meta: { fontFamily: fontFamily.mono, fontSize: 10, color: 'rgba(255,255,255,0.62)' },
});
