import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  BringToFront,
  SendToBack,
  Crop,
  Copy,
  Trash2,
  FlipHorizontal2,
  Sparkles,
  X,
} from 'lucide-react-native';
import { triggerHaptic } from '../../services/haptics';

interface QuickActionToolbarProps {
  visible: boolean;
  isMannequin?: boolean;
  onBringForward: () => void;
  onSendBackward: () => void;
  onCrop: () => void;
  onAICrop?: () => void;
  onDuplicate: () => void;
  onFlipHorizontal: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  visible,
  isMannequin = false,
  onBringForward,
  onSendBackward,
  onCrop,
  onAICrop,
  onDuplicate,
  onFlipHorizontal,
  onDelete,
  onDeselect,
}) => {
  if (!visible) return null;

  const handleAction = (
    fn: () => void,
    haptic: 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
  ) => {
    triggerHaptic(haptic);
    fn();
  };

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.container}>
        {/* Layer Forward & Backward only for clothes (Mannequin stays locked in background) */}
        {!isMannequin && (
          <>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAction(onBringForward)}
              activeOpacity={0.7}
            >
              <BringToFront size={17} color="#18181B" />
              <Text style={styles.btnLabel}>Vor</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAction(onSendBackward)}
              activeOpacity={0.7}
            >
              <SendToBack size={17} color="#18181B" />
              <Text style={styles.btnLabel}>Zurück</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}

        {/* AI Crop - available for BOTH clothes and Mannequin / own body photos! */}
        {onAICrop && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.aiBtn]}
              onPress={() => handleAction(onAICrop, 'medium')}
              activeOpacity={0.7}
            >
              <Sparkles size={17} color="#8B5CF6" />
              <Text style={[styles.btnLabel, styles.aiLabel]}>KI Crop</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
          </>
        )}

        {/* Manual Crop - available for BOTH clothes and Mannequin / own body photos! */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onCrop)}
          activeOpacity={0.7}
        >
          <Crop size={17} color="#18181B" />
          <Text style={styles.btnLabel}>Crop</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Flip Horizontal */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onFlipHorizontal)}
          activeOpacity={0.7}
        >
          <FlipHorizontal2 size={17} color="#18181B" />
          <Text style={styles.btnLabel}>Spiegeln</Text>
        </TouchableOpacity>

        {/* Duplicate only for clothes */}
        {!isMannequin && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleAction(onDuplicate)}
              activeOpacity={0.7}
            >
              <Copy size={17} color="#18181B" />
              <Text style={styles.btnLabel}>Kopieren</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider} />

        {/* Delete */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onDelete, 'warning')}
          activeOpacity={0.7}
        >
          <Trash2 size={17} color="#DC2626" />
          <Text style={[styles.btnLabel, styles.deleteText]}>
            {isMannequin ? 'Figur löschen' : 'Löschen'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Deselect / Close */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onDeselect)}
          activeOpacity={0.7}
        >
          <X size={17} color="#71717A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3F3F46',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#F4F4F5',
    marginHorizontal: 1,
  },
  deleteText: {
    color: '#DC2626',
  },
  aiBtn: {},
  aiLabel: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
