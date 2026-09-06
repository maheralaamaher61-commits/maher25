import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';

import { DashboardScreen } from '@/screens/DashboardScreen';
import { SalesScreen } from '@/screens/SalesScreen';
import { InventoryScreen } from '@/screens/InventoryScreen';
import { CustomersScreen } from '@/screens/CustomersScreen';
import { MoreScreen } from '@/screens/MoreScreen';

import { NewSaleScreen } from '@/screens/NewSaleScreen';
import { SaleDetailScreen } from '@/screens/SaleDetailScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProductFormScreen } from '@/screens/ProductFormScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CustomerFormScreen } from '@/screens/CustomerFormScreen';
import { CustomerProfileScreen } from '@/screens/CustomerProfileScreen';
import { CustomerLedgerScreen } from '@/screens/CustomerLedgerScreen';
import { SuppliersScreen } from '@/screens/SuppliersScreen';
import { SupplierFormScreen } from '@/screens/SupplierFormScreen';
import { SupplierProfileScreen } from '@/screens/SupplierProfileScreen';
import { NewPurchaseScreen } from '@/screens/NewPurchaseScreen';
import { PurchaseDetailScreen } from '@/screens/PurchaseDetailScreen';
import { PurchasesScreen } from '@/screens/PurchasesScreen';
import { ExpensesScreen } from '@/screens/ExpensesScreen';
import { ExpenseFormScreen } from '@/screens/ExpenseFormScreen';
import { StockMovementsScreen } from '@/screens/StockMovementsScreen';
import { InstallmentsScreen } from '@/screens/InstallmentsScreen';
import { ReceivablesScreen } from '@/screens/ReceivablesScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { BackupScreen } from '@/screens/BackupScreen';
import { BarcodeScannerScreen } from '@/screens/BarcodeScannerScreen';
import { PaymentScreen } from '@/screens/PaymentScreen';
import { InstallmentFormScreen } from '@/screens/InstallmentFormScreen';

export type RootStackParamList = {
  Main: undefined;
  NewSale: undefined;
  SaleDetail: { invoiceId: number };
  Products: undefined;
  ProductForm: { productId?: number; barcode?: string };
  ProductDetail: { productId: number };
  CustomerForm: { customerId?: number; quick?: boolean };
  CustomerProfile: { customerId: number };
  CustomerLedger: { customerId: number };
  Suppliers: undefined;
  SupplierForm: { supplierId?: number; quick?: boolean };
  SupplierProfile: { supplierId: number };
  NewPurchase: undefined;
  PurchaseDetail: { invoiceId: number };
  Purchases: undefined;
  Expenses: undefined;
  ExpenseForm: { expenseId?: number };
  StockMovements: { productId?: number };
  Installments: undefined;
  Receivables: undefined;
  Reports: undefined;
  Settings: undefined;
  Backup: undefined;
  BarcodeScanner: { onScan?: string; mode?: 'product' | 'sale' };
  Payment: { customerId: number; invoiceId?: number; installmentId?: number };
  InstallmentForm: { invoiceId: number; customerId: number; total: number; paid: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
type MainTabParamList = {
  Dashboard: undefined;
  Sales: undefined;
  Inventory: undefined;
  Customers: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'Cairo',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarLabel: 'الرئيسية', tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} /> }}
      />
      <Tab.Screen name="Sales" component={SalesScreen}
        options={{ tabBarLabel: 'المبيعات', tabBarIcon: ({ color, size }) => <Ionicons name="cart" color={color} size={size} /> }}
      />
      <Tab.Screen name="Inventory" component={InventoryScreen}
        options={{ tabBarLabel: 'المخزون', tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} /> }}
      />
      <Tab.Screen name="Customers" component={CustomersScreen}
        options={{ tabBarLabel: 'العملاء', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }}
      />
      <Tab.Screen name="More" component={MoreScreen}
        options={{ tabBarLabel: 'المزيد', tabBarIcon: ({ color, size }) => <Ionicons name="menu" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const theme = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="NewSale" component={NewSaleScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
      <Stack.Screen name="CustomerLedger" component={CustomerLedgerScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="SupplierForm" component={SupplierFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SupplierProfile" component={SupplierProfileScreen} />
      <Stack.Screen name="NewPurchase" component={NewPurchaseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
      <Stack.Screen name="Purchases" component={PurchasesScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="StockMovements" component={StockMovementsScreen} />
      <Stack.Screen name="Installments" component={InstallmentsScreen} />
      <Stack.Screen name="Receivables" component={ReceivablesScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="InstallmentForm" component={InstallmentFormScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
