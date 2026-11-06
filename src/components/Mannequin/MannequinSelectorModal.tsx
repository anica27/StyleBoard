import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  User,
  Camera,
  Image as ImageIcon,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { MANNEQUIN_DEFS } from '../../services/starterData';
import { CanvasItem } from '../../types';
import { triggerHaptic } from '../../services/haptics';
import { pickFromGallery, takePhoto } from '../../services/imageService';

interface MannequinSelectorModalProps {
  visible: boolean;
  currentMannequin: CanvasItem | null;
  onClose: () => void;
  onAddMannequin: (
    type: 'dressform' | 'female' | 'male' | 'custom',
    uri: string,
    width: number,
    height: number
  ) => void;
  onRemoveMannequin: () => void;
}

export const MannequinSelectorModal: React.FC<MannequinSelectorModalProps> = ({
  visible,
  currentMannequin,
  onClose,
  onAddMannequin,
  onRemoveMannequin,
}) => {
  const insets = useSafeAreaInsets();

  const handleSelectPreset = (
    type: 'dressform' | 'female' | 'male',
    asset: any,
    w: number,
    h: number
  ) => {
    triggerHaptic('success');
    const resolved = Image.resolveAssetSource(asset);
    onAddMannequin(type, resolved?.uri || '', w, h);
    onClose();
  };

  const handleCustomPhoto = async (source: 'camera' | 'gallery') => {
    try {
      triggerHaptic('medium');
      const result = source === 'camera' ? await takePhoto() : await pickFromGallery();
      if (result) {
        triggerHaptic('success');
        onAddMannequin('custom', result.uri, result.width, result.height);
        onClose();
      }
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Foto Fehler', err?.message || 'Foto konnte nicht geladen werden.');
    }
  };

  const handleRemove = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Mannequin entfernen',
      'Möchtest du die Figur von diesem Outfit-Board entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('error');
            onRemoveMannequin();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Figur & Mannequin</Text>
              <Text style={styles.subtitle}>
                Wähle eine Modell-Silhouette oder kleide dich selbst virtuell an
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* If a mannequin is already on board: show status & remove button */}
          {currentMannequin && (
            <View style={styles.activeBanner}>
              <View style={styles.activeBannerLeft}>
                <View style={styles.activeIndicator} />
                <View>
                  <Text style={styles.activeBannerTitle}>
                    {currentMannequin.mannequinType === 'custom'
                      ? 'Eigenes Foto aktiv'
                      : 'Mannequin auf diesem Board aktiv'}
                  </Text>
                  <Text style={styles.activeBannerSubtitle}>
                    Du kannst die Figur austauschen oder vom Board entfernen.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeMannequinBtn}
                onPress={handleRemove}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#DC2626" />
                <Text style={styles.removeMannequinText}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Standard Fashion Mannequins */}
            <Text style={styles.sectionTitle}>Modell-Silhouetten</Text>
            <View style={styles.presetsGrid}>
              {MANNEQUIN_DEFS.map((def) => {
                const isSelected =
                  currentMannequin?.mannequinType === def.id;

                return (
                  <TouchableOpacity
                    key={def.id}
                    style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                    onPress={() => handleSelectPreset(def.id, def.asset, def.width, def.height)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.presetImageContainer}>
                      <Image
                        source={def.asset}
                        style={styles.presetImage}
                        resizeMode="contain"
                      />
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{def.name}</Text>
                      <Text style={styles.presetDesc}>{def.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Photo / Yourself */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Mein Körper (Eigenes Foto ankleiden)
            </Text>
            <View style={styles.customCard}>
              <View style={styles.customCardInfo}>
                <Text style={styles.customCardTitle}>Ganzkörper-Foto von dir selbst</Text>
                <Text style={styles.customCardDesc}>
                  Nimm ein Foto von dir auf oder wähle eines aus deiner Galerie, um deine Outfits direkt an dir zu visualisieren.
                </Text>
              </View>

              <View style={styles.customBtnRow}>
                <TouchableOpacity
                  style={styles.customActionBtn}
                  onPress={() => handleCustomPhoto('camera')}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color="#18181B" />
                  <Text style={styles.customActionBtnText}>Foto aufnehmen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.customActionBtn}
                  onPress={() => handleCustomPhoto('gallery')}
                  activeOpacity={0.7}
                >
                  <ImageIcon size={18} color="#18181B" />
                  <Text style={styles.customActionBtnText}>Aus Galerie wählen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContent: {
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 20,
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
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  activeBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  activeBannerSubtitle: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  removeMannequinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeMannequinText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  presetCardSelected: {
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  presetImageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    padding: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
  },
  presetDesc: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 2,
    lineHeight: 13,
  },
  customCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  customCardInfo: {
    marginBottom: 12,
  },
  customCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  customCardDesc: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
    lineHeight: 16,
  },
  customBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  customActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
  },
});
