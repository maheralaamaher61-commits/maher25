import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/constants/theme';
import { exportAllData, importAllData } from '@/database/db';
import { Button, ConfirmDialog } from '@/components/ui/Inputs';
import { LoadingState } from '@/components/ui/Cards';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export function BackupScreen({ navigation }: any) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreData, setRestoreData] = useState<Record<string, any[]> | null>(null);
  const [restoreSummary, setRestoreSummary] = useState('');

  const handleBackup = async () => {
    setLoading(true);
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify({ version: 1, timestamp: new Date().toISOString(), data }, null, 2);
      const filename = `store_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'حفظ النسخة الاحتياطية' });
      } else {
        Alert.alert('تم', `تم حفظ النسخة في: ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'application/json' });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      let parsed: any;
      try { parsed = JSON.parse(content); } catch { Alert.alert('خطأ', 'الملف غير صالح'); return; }
      if (!parsed.data || typeof parsed.data !== 'object') { Alert.alert('خطأ', 'بنية الملف غير صحيحة'); return; }
      const summary = Object.entries(parsed.data).filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0).map(([k, v]) => `${k}: ${(v as any[]).length}`).join('\n');
      setRestoreData(parsed.data);
      setRestoreSummary(summary || 'الملف يحتوي على بيانات');
      setShowRestoreConfirm(true);
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذر قراءة الملف: ' + e.message);
    }
  };

  const handleRestore = async () => {
    if (!restoreData) return;
    setShowRestoreConfirm(false);
    setLoading(true);
    try {
      await importAllData(restoreData);
      Alert.alert('تم', 'تم استعادة البيانات بنجاح');
      setRestoreData(null);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="جاري المعالجة..." />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>النسخ الاحتياطي</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.success + '15' }]}>
            <Ionicons name="cloud-upload" size={32} color={theme.success} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>إنشاء نسخة احتياطية</Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>تصدير جميع البيانات إلى ملف يمكن مشاركته أو حفظه.</Text>
          <Button title="إنشاء نسخة احتياطية" onPress={handleBackup} icon="download" />
        </View>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.info + '15' }]}>
            <Ionicons name="cloud-download" size={32} color={theme.info} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>استعادة نسخة احتياطية</Text>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>اختيار ملف لاستعادة البيانات. سيتم استبدال البيانات الحالية.</Text>
          <Button title="استعادة من ملف" onPress={handlePickFile} variant="outline" icon="cloud-upload" />
        </View>
      </View>
      <ConfirmDialog visible={showRestoreConfirm} title="استعادة البيانات" message={`سيتم استبدال جميع البيانات.\n\nملخص:\n${restoreSummary}\n\nهل أنت متأكد؟`} confirmText="استعادة" onConfirm={handleRestore} onCancel={() => { setShowRestoreConfirm(false); setRestoreData(null); }} danger />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  content: { padding: 16, gap: 16 },
  card: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 12 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Cairo' },
  cardDesc: { fontSize: 14, fontFamily: 'Cairo', textAlign: 'center', lineHeight: 22 },
});
