import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  Layers,
  BringToFront,
  SendToBack,
  Crop,
  Copy,
  Trash2,
  FlipHorizontal2,
  X,
} from 'lucide-react-native';
import { triggerHaptic } from '../../services/haptics';

interface QuickActionToolbarProps {
  visible: boolean;
  onBringForward: () => void;
  onSendBackward: () => void;
  onCrop: () => void;
  onDuplicate: () => void;
  onFlipHorizontal: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  visible,
  onBringForward,
  onSendBackward,
  onCrop,
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
        {/* Layer Forward */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onBringForward)}
          activeOpacity={0.7}
        >
          <BringToFront size={18} color="#18181B" />
          <Text style={styles.btnLabel}>Vor</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Layer Backward */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onSendBackward)}
          activeOpacity={0.7}
        >
          <SendToBack size={18} color="#18181B" />
          <Text style={styles.btnLabel}>Zurück</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Manual Crop */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onCrop)}
          activeOpacity={0.7}
        >
          <Crop size={18} color="#18181B" />
          <Text style={styles.btnLabel}>Crop</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Flip Horizontal */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onFlipHorizontal)}
          activeOpacity={0.7}
        >
          <FlipHorizontal2 size={18} color="#18181B" />
          <Text style={styles.btnLabel}>Spiegeln</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Duplicate */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onDuplicate)}
          activeOpacity={0.7}
        >
          <Copy size={18} color="#18181B" />
          <Text style={styles.btnLabel}>Kopieren</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Delete */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleAction(onDelete, 'warning')}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color="#DC2626" />
          <Text style={[styles.btnLabel, styles.deleteText]}>Löschen</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Deselect / Close */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleAction(onDeselect)}
          activeOpacity={0.7}
        >
          <X size={18} color="#71717A" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
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
    height: 24,
    backgroundColor: '#F4F4F5',
    marginHorizontal: 2,
  },
  deleteBtn: {
    // slight danger tint
  },
  deleteText: {
    color: '#DC2626',
  },
});
