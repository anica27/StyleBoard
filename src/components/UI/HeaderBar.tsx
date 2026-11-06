import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Layers,
  ShoppingBag,
  Share,
  Grid,
  ChevronDown,
} from 'lucide-react-native';
import { triggerHaptic } from '../../services/haptics';

interface HeaderBarProps {
  boardTitle: string;
  gridVisible: boolean;
  onOpenOutfits: () => void;
  onOpenWardrobe: () => void;
  onToggleGrid: () => void;
  onExport: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  boardTitle,
  gridVisible,
  onOpenOutfits,
  onOpenWardrobe,
  onToggleGrid,
  onExport,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        {/* Active Outfit Selector */}
        <TouchableOpacity
          style={styles.outfitSelector}
          onPress={() => {
            triggerHaptic('light');
            onOpenOutfits();
          }}
          activeOpacity={0.7}
        >
          <Layers size={16} color="#18181B" />
          <Text style={styles.outfitTitle} numberOfLines={1}>
            {boardTitle}
          </Text>
          <ChevronDown size={14} color="#71717A" />
        </TouchableOpacity>

        {/* Right Action Icons */}
        <View style={styles.rightActions}>
          {/* Toggle Dot Grid */}
          <TouchableOpacity
            style={[styles.actionIconBtn, gridVisible && styles.actionIconBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              onToggleGrid();
            }}
            activeOpacity={0.7}
          >
            <Grid size={18} color={gridVisible ? '#18181B' : '#A1A1AA'} />
          </TouchableOpacity>

          {/* Open Wardrobe Bottom Sheet */}
          <TouchableOpacity
            style={styles.wardrobeBtn}
            onPress={() => {
              triggerHaptic('medium');
              onOpenWardrobe();
            }}
            activeOpacity={0.7}
          >
            <ShoppingBag size={16} color="#18181B" />
            <Text style={styles.wardrobeBtnText}>Kleiderschrank</Text>
          </TouchableOpacity>

          {/* Export Moodboard */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={() => {
              triggerHaptic('medium');
              onExport();
            }}
            activeOpacity={0.7}
          >
            <Share size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  outfitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: '45%',
  },
  outfitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnActive: {
    backgroundColor: '#E4E4E7',
  },
  wardrobeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  wardrobeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
  },
  exportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
