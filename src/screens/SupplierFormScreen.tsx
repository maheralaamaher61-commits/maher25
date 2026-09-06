import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/constants/theme';
import { addSupplier, updateSupplier, getSupplier } from '@/database/db';
import { TextField, Button } from '@/components/ui/Inputs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SupplierForm'>;

export function SupplierFormScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { supplierId } = route.params;
  const isEdit = !!supplierId;

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (supplierId) {
        (async () => {
          const s = await getSupplier(supplierId);
          if (s) {
            setName(s.name);
            setCompany(s.company ?? '');
            setPhone(s.phone ?? '');
            setAddress(s.address ?? '');
            setTaxNumber(s.tax_number ?? '');
            setNotes(s.notes ?? '');
          }
        })();
      }
    }, [supplierId]),
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        company: company.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        tax_number: taxNumber.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEdit && supplierId) {
        await updateSupplier(supplierId, data);
      } else {
        await addSupplier(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'تعديل مورد' : 'مورد جديد'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <TextField label="اسم المورد *" value={name} onChangeText={setName} placeholder="اسم المورد" icon="storefront" />
          <TextField label="اسم الشركة" value={company} onChangeText={setCompany} placeholder="اسم الشركة" icon="business" />
          <TextField label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" icon="call" keyboardType="phone-pad" />
          <TextField label="العنوان" value={address} onChangeText={setAddress} placeholder="العنوان" icon="location" />
          <TextField label="الرقم الضريبي" value={taxNumber} onChangeText={setTaxNumber} placeholder="الرقم الضريبي" />
          <TextField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات" multiline />
        </ScrollView>
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button title={saving ? 'جاري الحفظ...' : 'حفظ'} onPress={handleSave} disabled={saving} size="large" icon="checkmark-circle" style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
