import { useColorScheme } from 'react-native';
import { ACCENT_COLORS } from '@/constants';

export const lightTheme = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  success: '#059669',
  successBg: '#ECFDF5',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  info: '#2563EB',
  infoBg: '#EFF6FF',
  shadow: '#000000',
  accent: '#2563EB',
  accentLight: '#DBEAFE',
  accentDark: '#1D4ED8',
};

export type Theme = typeof lightTheme;

export function useTheme(): Theme {
  return lightTheme;
}

export function getAccentColor(): string {
  return ACCENT_COLORS[0].value;
}
