import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, RotateCcw, Scissors, Sparkles } from 'lucide-react-native';
import { CanvasItem, CropRect } from '../../types';
import { cropImageLocally, getImageDimensions } from '../../services/imageService';
import { triggerHaptic } from '../../services/haptics';

interface ImageCropModalProps {
  visible: boolean;
  item: CanvasItem | null;
  onClose: () => void;
  onApplyCrop: (itemId: string, newUri: string, width: number, height: number) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  visible,
  item,
  onClose,
  onApplyCrop,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 300, height: 300 });

  // Insets as percentage from each edge (0 to 45%)
  const [cropInsets, setCropInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const uriToCrop = item?.originalUri || item?.uri;

  useEffect(() => {
    if (visible && uriToCrop) {
      setLoading(true);
      getImageDimensions(uriToCrop).then((dims) => {
        setNaturalDimensions(dims);
        setCropInsets({ top: 0, bottom: 0, left: 0, right: 0 });
        setLoading(false);
      });
    }
  }, [visible, uriToCrop]);

  if (!item || !uriToCrop) return null;

  // Calculate container dimensions preserving aspect ratio
  const previewMaxW = SCREEN_WIDTH - 48;
  const previewMaxH = SCREEN_HEIGHT * 0.45;
  const imgAspect = naturalDimensions.width / Math.max(1, naturalDimensions.height);

  let previewW = previewMaxW;
  let previewH = previewMaxW / imgAspect;
  if (previewH > previewMaxH) {
    previewH = previewMaxH;
    previewW = previewMaxH * imgAspect;
  }

  // Quick Preset Handlers
  const handlePreset = (type: 'reset' | 'cutBottomPrice' | 'cutHeader' | 'cutBoth' | 'square') => {
    triggerHaptic('selection');
    switch (type) {
      case 'reset':
        setCropInsets({ top: 0, bottom: 0, left: 0, right: 0 });
        break;
      case 'cutBottomPrice':
        // Cut 18% from bottom to remove prices & store buttons
        setCropInsets((prev) => ({ ...prev, bottom: 18 }));
        break;
      case 'cutHeader':
        // Cut 14% from top to remove website navigation/status bar
        setCropInsets((prev) => ({ ...prev, top: 14 }));
        break;
      case 'cutBoth':
        // Remove both website header and bottom price bar
        setCropInsets({ top: 14, bottom: 18, left: 0, right: 0 });
        break;
      case 'square': {
        if (naturalDimensions.height > naturalDimensions.width) {
          const diffPct = ((naturalDimensions.height - naturalDimensions.width) / naturalDimensions.height) * 100;
          setCropInsets({ top: Math.round(diffPct / 2), bottom: Math.round(diffPct / 2), left: 0, right: 0 });
        } else {
          const diffPct = ((naturalDimensions.width - naturalDimensions.height) / naturalDimensions.width) * 100;
          setCropInsets({ top: 0, bottom: 0, left: Math.round(diffPct / 2), right: Math.round(diffPct / 2) });
        }
        break;
      }
    }
  };

  const handleStepInset = (side: 'top' | 'bottom' | 'left' | 'right', delta: number) => {
    triggerHaptic('light');
    setCropInsets((prev) => {
      const nextVal = Math.max(0, Math.min(45, prev[side] + delta));
      return { ...prev, [side]: nextVal };
    });
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      triggerHaptic('medium');

      const originX = (cropInsets.left / 100) * naturalDimensions.width;
      const originY = (cropInsets.top / 100) * naturalDimensions.height;
      const cropW = naturalDimensions.width * (1 - (cropInsets.left + cropInsets.right) / 100);
      const cropH = naturalDimensions.height * (1 - (cropInsets.top + cropInsets.bottom) / 100);

      const cropRect: CropRect = {
        originX,
        originY,
        width: cropW,
        height: cropH,
      };

      const result = await cropImageLocally(uriToCrop, cropRect);
      triggerHaptic('success');
      onApplyCrop(item.id, result.uri, result.width, result.height);
      onClose();
    } catch (err) {
      console.error('Crop error:', err);
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
            <X size={22} color="#18181B" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Zuschneiden</Text>
            <Text style={styles.headerSubtitle}>Website-Ränder & Preise entfernen</Text>
          </View>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.confirmBtn, loading && styles.btnDisabled]}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Fertig</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Live Preview Area */}
        <View style={styles.previewContainer}>
          <View style={[styles.previewFrame, { width: previewW, height: previewH }]}>
            <Image
              source={{ uri: uriToCrop }}
              style={{ width: previewW, height: previewH }}
              resizeMode="stretch"
            />

            {/* Shaded Overlays for cropped areas */}
            {/* Top overlay */}
            <View
              style={[
                styles.cropShade,
                { top: 0, left: 0, right: 0, height: `${cropInsets.top}%` },
              ]}
            />
            {/* Bottom overlay */}
            <View
              style={[
                styles.cropShade,
                { bottom: 0, left: 0, right: 0, height: `${cropInsets.bottom}%` },
              ]}
            />
            {/* Left overlay */}
            <View
              style={[
                styles.cropShade,
                {
                  top: `${cropInsets.top}%`,
                  bottom: `${cropInsets.bottom}%`,
                  left: 0,
                  width: `${cropInsets.left}%`,
                },
              ]}
            />
            {/* Right overlay */}
            <View
              style={[
                styles.cropShade,
                {
                  top: `${cropInsets.top}%`,
                  bottom: `${cropInsets.bottom}%`,
                  right: 0,
                  width: `${cropInsets.right}%`,
                },
              ]}
            />

            {/* Crop Boundary Indicator */}
            <View
              style={[
                styles.cropBox,
                {
                  top: `${cropInsets.top}%`,
                  bottom: `${cropInsets.bottom}%`,
                  left: `${cropInsets.left}%`,
                  right: `${cropInsets.right}%`,
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.cornerIndicator, styles.cTL]} />
              <View style={[styles.cornerIndicator, styles.cTR]} />
              <View style={[styles.cornerIndicator, styles.cBL]} />
              <View style={[styles.cornerIndicator, styles.cBR]} />
            </View>
          </View>
        </View>

        {/* Controls & Quick Presets */}
        <ScrollView style={styles.controlsScroll} showsVerticalScrollIndicator={false}>
          {/* Quick Presets */}
          <Text style={styles.sectionTitle}>Schnell-Zuschnitt</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('cutBottomPrice')}
              activeOpacity={0.7}
            >
              <Scissors size={14} color="#18181B" />
              <Text style={styles.presetText}>Preise unten (-18%)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('cutHeader')}
              activeOpacity={0.7}
            >
              <Scissors size={14} color="#18181B" />
              <Text style={styles.presetText}>Header oben (-14%)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('cutBoth')}
              activeOpacity={0.7}
            >
              <Sparkles size={14} color="#18181B" />
              <Text style={styles.presetText}>Oben & Unten</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => handlePreset('reset')}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color="#71717A" />
              <Text style={[styles.presetText, { color: '#71717A' }]}>Zurücksetzen</Text>
            </TouchableOpacity>
          </View>

          {/* Fine Tuning Controls */}
          <Text style={styles.sectionTitle}>Feinabstimmung (Ränder trimmen)</Text>
          <View style={styles.slidersCard}>
            {/* Top Inset */}
            <View style={styles.edgeControlRow}>
              <Text style={styles.edgeLabel}>Oben: {cropInsets.top}%</Text>
              <View style={styles.stepGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('top', -4)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('top', 4)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Inset */}
            <View style={styles.edgeControlRow}>
              <Text style={styles.edgeLabel}>Unten: {cropInsets.bottom}%</Text>
              <View style={styles.stepGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('bottom', -4)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('bottom', 4)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Left Inset */}
            <View style={styles.edgeControlRow}>
              <Text style={styles.edgeLabel}>Links: {cropInsets.left}%</Text>
              <View style={styles.stepGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('left', -4)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('left', 4)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Inset */}
            <View style={[styles.edgeControlRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.edgeLabel}>Rechts: {cropInsets.right}%</Text>
              <View style={styles.stepGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('right', -4)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepInset('right', 4)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#F4F4F5',
  },
  previewFrame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cropShade: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cornerIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: '#3B82F6',
  },
  cTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  controlsScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#18181B',
  },
  slidersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 30,
  },
  edgeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  edgeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
  stepGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#18181B',
    lineHeight: 22,
  },
});
