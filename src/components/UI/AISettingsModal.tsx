import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Key, Check, ShieldCheck, ExternalLink } from 'lucide-react-native';
import { getGeminiApiKey, setGeminiApiKey } from '../../services/aiService';
import { triggerHaptic } from '../../services/haptics';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';

interface AISettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (visible) {
      getGeminiApiKey().then((key) => {
        setApiKeyInput(key || '');
      });
    }
  }, [visible]);

  const handleSave = async () => {
    triggerHaptic('success');
    await setGeminiApiKey(apiKeyInput.trim());
    Alert.alert(
      'Gespeichert',
      'Dein API-Key wurde rein lokal auf deinem Smartphone gespeichert und ist sofort aktiv.'
    );
    onClose();
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      contentStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <Key size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.title}>KI-Einstellungen</Text>
            <Text style={styles.subtitle}>Google Gemini API-Key</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

          {/* Privacy Banner */}
          <View style={styles.privacyBanner}>
            <ShieldCheck size={18} color="#15803D" />
            <Text style={styles.privacyText}>
              Datenschutz: Dein API-Key wird ausschließlich lokal auf deinem Gerät im privaten Speicher (AsyncStorage) gesichert und niemals auf GitHub oder externe Server übertragen.
            </Text>
          </View>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gemini API-Key</Text>
            <TextInput
              style={styles.keyInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Füge hier deinen Google Gemini API-Key ein..."
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Lokal speichern</Text>
            </TouchableOpacity>
          </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  keyInput: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#18181B',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
