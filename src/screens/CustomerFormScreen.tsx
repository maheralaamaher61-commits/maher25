import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/constants/theme';
import { addCustomer, updateCustomer, getCustomer } from '@/database/db';
import { TextField, Button, Chip } from '@/components/ui/Inputs';
import { GOVERNORATES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerForm'>;

export function CustomerFormScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { customerId, quick } = route.params;
  const isEdit = !!customerId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (customerId) {
        (async () => {
          const c = await getCustomer(customerId);
          if (c) {
            setName(c.name);
            setPhone(c.phone ?? '');
            setGovernorate(c.governorate ?? '');
            setAddress(c.address ?? '');
            setNotes(c.notes ?? '');
          }
        })();
      }
    }, [customerId]),
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
        phone: phone.trim() || null,
        governorate: governorate || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      };
      if (isEdit && customerId) {
        await updateCustomer(customerId, data);
      } else {
        await addCustomer(data);
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
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'تعديل عميل' : 'عميل جديد'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <TextField label="الاسم *" value={name} onChangeText={setName} placeholder="اسم العميل" icon="person" />
          <TextField label="رقم الهاتف" value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" icon="call" keyboardType="phone-pad" />
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>المحافظة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipsRow}>
                <Chip label="بدون" selected={governorate === ''} onPress={() => setGovernorate('')} />
                {GOVERNORATES.map((g) => (
                  <Chip key={g} label={g} selected={governorate === g} onPress={() => setGovernorate(g)} />
                ))}
              </View>
            </ScrollView>
          </View>
          <TextField label="العنوان التفصيلي" value={address} onChangeText={setAddress} placeholder="العنوان" icon="location" />
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
  section: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Cairo', marginBottom: 6 },
  chipsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  bottomBar: { padding: 16, borderTopWidth: 1 },
});
