import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SalesScreen from '../screens/SalesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'لوحة التحكم' }}
      />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Products" 
        component={ProductsScreen} 
        options={{ title: 'المنتجات' }}
      />
    </Stack.Navigator>
  );
}

function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Sales" 
        component={SalesScreen} 
        options={{ title: 'المبيعات' }}
      />
    </Stack.Navigator>
  );
}

function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Expenses" 
        component={ExpensesScreen} 
        options={{ title: 'المصروفات' }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: 'التقارير' }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'الإعدادات' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'dashboard' : 'dashboard';
          } else if (route.name === 'ProductsTab') {
            iconName = focused ? 'inventory' : 'inventory-2';
          } else if (route.name === 'SalesTab') {
            iconName = focused ? 'shopping-cart' : 'shopping-cart';
          } else if (route.name === 'ExpensesTab') {
            iconName = focused ? 'receipt' : 'receipt';
          } else if (route.name === 'ReportsTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings';
          }

          return <MaterialIcons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack} 
        options={{ title: 'الرئيسية' }}
      />
      <Tab.Screen 
        name="ProductsTab" 
        component={ProductsStack} 
        options={{ title: 'المنتجات' }}
      />
      <Tab.Screen 
        name="SalesTab" 
        component={SalesStack} 
        options={{ title: 'المبيعات' }}
      />
      <Tab.Screen 
        name="ExpensesTab" 
        component={ExpensesStack} 
        options={{ title: 'المصروفات' }}
      />
      <Tab.Screen 
        name="ReportsTab" 
        component={ReportsStack} 
        options={{ title: 'التقارير' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStack} 
        options={{ title: 'الإعدادات' }}
      />
    </Tab.Navigator>
  );
}