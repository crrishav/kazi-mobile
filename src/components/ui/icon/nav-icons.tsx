import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Ported 1:1 from the design's bottom tab bar (Kazi Dashboard.dc.html).
// These are the only hand-authored icons — everything else uses Feather
// from @expo/vector-icons via components/ui/icon/index.tsx.

export interface NavIconProps {
  size?: number;
  color: string;
}

export function DashboardIcon({ size = 22, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Rect x={3} y={3} width={7.5} height={7.5} rx={2} />
      <Rect x={13.5} y={3} width={7.5} height={7.5} rx={2} />
      <Rect x={3} y={13.5} width={7.5} height={7.5} rx={2} />
      <Rect x={13.5} y={13.5} width={7.5} height={7.5} rx={2} />
    </Svg>
  );
}

export function TasksIcon({ size = 22, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M4 7h9M4 12h9M4 17h6" />
      <Path d="M16.5 16.5l2 2 3.5-4" />
    </Svg>
  );
}

export function InventoryIcon({ size = 22, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.5 8l8.5-4.5L20.5 8v8L12 20.5 3.5 16z" />
      <Path d="M3.5 8l8.5 4.5L20.5 8M12 12.5v8" />
    </Svg>
  );
}

export function FinanceIcon({ size = 22, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5v9M9.5 10h5M9.5 14h5" />
    </Svg>
  );
}

export function MoreIcon({ size = 22, color }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5.5} cy={12} r={1.4} fill={color} />
      <Circle cx={12} cy={12} r={1.4} fill={color} />
      <Circle cx={18.5} cy={12} r={1.4} fill={color} />
    </Svg>
  );
}
