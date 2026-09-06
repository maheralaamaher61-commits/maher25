import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface StatCardProps {
  title: string;
  value: string;
  icon: IconName;
  color?: string;
  onPress?: () => void;
  subtitle?: string;
}

export function StatCard({ title, value, icon, color, onPress, subtitle }: StatCardProps) {
  const theme = useTheme();
  const accentColor = color ?? theme.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '15' }]}>
        <Ionicons name={icon} size={22} color={accentColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

interface AlertCardProps {
  title: string;
  count: number;
  icon: IconName;
  color: string;
  onPress?: () => void;
}

export function AlertCard({ title, count, icon, color, onPress }: AlertCardProps) {
  const theme = useTheme();
  if (count === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.alertCard, { backgroundColor: color + '10', borderColor: color + '30' }]}
      activeOpacity={0.7}
    >
      <View style={[styles.alertIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.alertCount, { color }]}>{count} عنصر</Text>
      </View>
      <Ionicons name="chevron-back" size={20} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionText, onAction }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {actionText && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.sectionAction, { color: theme.accent }]}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionText, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={icon} size={48} color={theme.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {message ? <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>{message}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.emptyButton, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.emptyButtonText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={theme.accent} />
      {message ? <Text style={[styles.loadingText, { color: theme.textSecondary }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Cairo',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Cairo',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Cairo',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  alertCount: {
    fontSize: 13,
    fontFamily: 'Cairo',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: 'Cairo',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Cairo',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Cairo',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Cairo',
    marginTop: 12,
  },
});
