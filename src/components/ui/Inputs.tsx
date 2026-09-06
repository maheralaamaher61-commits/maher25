import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: IconName;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', icon, size = 'medium', disabled, style }: ButtonProps) {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.accent
    : variant === 'danger' ? theme.error
    : variant === 'secondary' ? theme.surfaceAlt
    : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? '#fff' : theme.text;
  const border = variant === 'outline' ? theme.border : 'transparent';

  const padding = size === 'small' ? { paddingVertical: 8, paddingHorizontal: 14 }
    : size === 'large' ? { paddingVertical: 16, paddingHorizontal: 24 }
    : { paddingVertical: 12, paddingHorizontal: 20 };
  const fontSize = size === 'small' ? 13 : size === 'large' ? 16 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 }, padding, style]}
      activeOpacity={0.7}
    >
      {icon ? <Ionicons name={icon} size={fontSize + 2} color={fg} style={{ marginLeft: 6 }} /> : null}
      <Text style={[styles.buttonText, { color: fg, fontSize }]}>{title}</Text>
    </TouchableOpacity>
  );
}

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: IconName;
  containerStyle?: ViewStyle;
}

export function TextField({ label, error, icon, containerStyle, ...props }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <View style={[
        styles.inputWrap,
        { backgroundColor: theme.surfaceAlt, borderColor: error ? theme.error : theme.border },
      ]}>
        {icon ? <Ionicons name={icon} size={20} color={theme.textTertiary} style={{ marginLeft: 8 }} /> : null}
        <TextInput
          {...props}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textTertiary}
          textAlign="right"
        />
      </View>
      {error ? <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text> : null}
    </View>
  );
}

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'بحث...', onClear }: SearchBarProps) {
  const theme = useTheme();
  return (
    <View style={[styles.searchWrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <Ionicons name="search" size={20} color={theme.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        style={[styles.searchInput, { color: theme.text }]}
        textAlign="right"
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }}>
          <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
}

export function Badge({ text, color, bgColor }: BadgeProps) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: bgColor ?? theme.accent + '15' }]}>
      <Text style={[styles.badgeText, { color: color ?? theme.accent }]}>{text}</Text>
    </View>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({ visible, title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', onConfirm, onCancel, danger }: ConfirmDialogProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.dialog, { backgroundColor: theme.surface }]}>
          <Text style={[styles.dialogTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.dialogMessage, { color: theme.textSecondary }]}>{message}</Text>
          <View style={styles.dialogActions}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.dialogButton, { backgroundColor: theme.surfaceAlt }]}
            >
              <Text style={[styles.dialogButtonText, { color: theme.text }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.dialogButton, { backgroundColor: danger ? theme.error : theme.accent }]}
            >
              <Text style={[styles.dialogButtonText, { color: '#fff' }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          {title ? <Text style={[styles.sheetTitle, { color: theme.text }]}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.surfaceAlt,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Cairo',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Cairo',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Cairo',
    marginTop: 4,
  },
  searchWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Cairo',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dialog: {
    marginHorizontal: 20,
    marginVertical: 'auto',
    borderRadius: 20,
    padding: 24,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Cairo',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 14,
    fontFamily: 'Cairo',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Cairo',
    marginBottom: 16,
    textAlign: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Cairo',
  },
});
