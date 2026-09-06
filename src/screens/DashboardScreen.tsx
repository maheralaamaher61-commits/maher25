import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Dimensions } from 'react-native';
import { db } from '../database/db';
import { DashboardStats } from '../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    today_sales: 0,
    today_purchases: 0,
    today_expenses: 0,
    today_profit: 0,
    sales_invoice_count: 0,
    purchase_invoice_count: 0,
    inventory_value: 0,
    total_receivables: 0,
    today_due: 0,
    overdue_installments: 0,
    low_stock_count: 0,
    near_expiry_count: 0,
    expired_count: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Today sales
      const salesToday = await db.getFirstAsync(
        `SELECT SUM(total) as total FROM sales_invoices WHERE date = ?`,
        [today]
      ) as any;

      // Total customers
      const salesCount = await db.getFirstAsync(
        `SELECT COUNT(*) as count FROM sales_invoices`
      ) as any;

      // Inventory value
      const inventoryValue = await db.getFirstAsync(
        `SELECT SUM(quantity * sale_price) as value FROM products`
      ) as any;

      setStats(prev => ({
        ...prev,
        today_sales: salesToday?.total || 0,
        sales_invoice_count: salesCount?.count || 0,
        inventory_value: inventoryValue?.value || 0,
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const StatCard = ({ title, value }: { title: string; value: string | number }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
      </View>

      <View style={styles.grid}>
        <StatCard title="مبيعات اليوم" value={`${stats.today_sales} ج.م`} />
        <StatCard title="الفواتير" value={stats.sales_invoice_count} />
        <StatCard title="قيمة المخزون" value={`${stats.inventory_value} ج.م`} />
        <StatCard title="الديون" value={`${stats.total_receivables} ج.م`} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  card: {
    width: (width - 32) / 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
});