import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { X, Download, Share2, CheckCircle2 } from 'lucide-react-native';
import { triggerHaptic } from '../../services/haptics';

interface ExportModalProps {
  visible: boolean;
  imageUri: string | null;
  boardTitle: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  imageUri,
  boardTitle,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!imageUri) return null;

  const handleSaveToLibrary = async () => {
    try {
      setSaving(true);
      triggerHaptic('medium');

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Berechtigung erforderlich',
          'Bitte erlaube Zugriff auf deine Fotos, um das Moodboard zu speichern.'
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      setSavedSuccess(true);
      triggerHaptic('success');

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Save to library error:', err);
      triggerHaptic('error');
      Alert.alert('Fehler beim Speichern', err?.message || 'Das Bild konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      triggerHaptic('light');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Hinweis', 'Teilen ist auf diesem Gerät nicht verfügbar.');
        return;
      }
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: `${boardTitle} - StyleBoard Export`,
      });
    } catch (err: any) {
      console.error('Share error:', err);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Exportiertes Moodboard</Text>
              <Text style={styles.subtitle}>{boardTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Preview Image */}
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {savedSuccess && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={16} color="#15803D" />
              <Text style={styles.successText}>Erfolgreich in deiner Galerie gespeichert!</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={handleSaveToLibrary}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>In Fotos speichern</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={18} color="#18181B" />
              <Text style={styles.shareBtnText}>Teilen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 360,
    backgroundColor: '#FBFBFC',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#18181B',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  shareBtnText: {
    color: '#18181B',
    fontSize: 14,
    fontWeight: '600',
  },
});
