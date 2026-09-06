import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { db } from '../database/db';
import { Settings } from '../types';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await db.getFirstAsync('SELECT * FROM settings LIMIT 1') as any;
      if (result) {
        setSettings(result);
        setStoreName(result.store_name || '');
        setStorePhone(result.store_phone || '');
        setStoreAddress(result.store_address || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await db.runAsync(
        `UPDATE settings SET store_name = ?, store_phone = ?, store_address = ? WHERE id = 1`,
        [storeName, storePhone, storeAddress]
      );
      alert('تم حفظ الإعدادات');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ في حفظ الإعدادات');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>اسم المتجر</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="اسم المتجر"
        />

        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={storePhone}
          onChangeText={setStorePhone}
          placeholder="رقم الهاتف"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>العنوان</Text>
        <TextInput
          style={styles.input}
          value={storeAddress}
          onChangeText={setStoreAddress}
          placeholder="عنوان المتجر"
          multiline
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>حفظ</Text>
        </TouchableOpacity>
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
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});