import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = { navigation: any };

export function MoreScreen({ navigation }: Props) {
  const theme = useTheme();

  const items = [
    { icon: 'bag' as const, label: 'المشتريات', screen: 'Purchases' as const, color: theme.info },
    { icon: 'people' as const, label: 'الموردين', screen: 'Suppliers' as const, color: theme.success },
    { icon: 'wallet' as const, label: 'المصروفات', screen: 'Expenses' as const, color: theme.warning },
    { icon: 'cash' as const, label: 'الأقساط والمستحقات', screen: 'Installments' as const, color: theme.error },
    { icon: 'bar-chart' as const, label: 'التقارير', screen: 'Reports' as const, color: theme.accent },
    { icon: 'swap-horizontal' as const, label: 'حركات المخزون', screen: 'StockMovements' as const, color: theme.info },
    { icon: 'download' as const, label: 'النسخ الاحتياطي', screen: 'Backup' as const, color: theme.success },
    { icon: 'settings' as const, label: 'الإعدادات', screen: 'Settings' as const, color: theme.textSecondary },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>المزيد</Text>
      </View>
      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate(item.screen, {} as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.cardIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.text }]}>{item.label}</Text>
            <Ionicons name="chevron-back" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: 'Cairo' },
  grid: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { flex: 1, fontSize: 16, fontWeight: '600', fontFamily: 'Cairo' },
});
