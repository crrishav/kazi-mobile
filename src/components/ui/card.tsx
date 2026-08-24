import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { radii } from '@/theme';

export type CardElevation = 'flat' | 'raised' | 'sheet' | 'inverted';

export interface CardProps {
  elevation?: CardElevation;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** "Cards over lists": group related numbers into a card with internal dividers, per the style guide. */
export function Card({ elevation = 'raised', children, style }: CardProps) {
  const theme = useTheme();

  const borderRadius = elevation === 'flat' ? radii.md : elevation === 'sheet' ? radii.xl : radii.lg;
  const isInverted = elevation === 'inverted';

  return (
    <View
      style={[
        {
          borderRadius,
          backgroundColor: isInverted ? theme.surfaceInverted : theme.surface,
          borderWidth: elevation === 'flat' || theme.scheme === 'dark' ? 1 : 0,
          borderColor: theme.border,
          boxShadow: isInverted
            ? undefined
            : elevation === 'sheet'
              ? theme.shadows.sheet
              : elevation === 'raised'
                ? theme.shadows.raised
                : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
