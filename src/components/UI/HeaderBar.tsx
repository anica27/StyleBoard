import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Layers,
  ShoppingBag,
  Share,
  Grid,
  ChevronDown,
  User,
  Sparkles,
} from 'lucide-react-native';
import { triggerHaptic } from '../../services/haptics';

interface HeaderBarProps {
  boardTitle: string;
  gridVisible: boolean;
  hasMannequin: boolean;
  onOpenOutfits: () => void;
  onOpenWardrobe: () => void;
  onOpenMannequin: () => void;
  onOpenStylist: () => void;
  onToggleGrid: () => void;
  onExport: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  boardTitle,
  gridVisible,
  hasMannequin,
  onOpenOutfits,
  onOpenWardrobe,
  onOpenMannequin,
  onOpenStylist,
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
          <Layers size={15} color="#18181B" />
          <Text style={styles.outfitTitle} numberOfLines={1}>
            {boardTitle}
          </Text>
          <ChevronDown size={13} color="#71717A" />
        </TouchableOpacity>

        {/* Right Action Icons */}
        <View style={styles.rightActions}>
          {/* Mannequin / Figur Button */}
          <TouchableOpacity
            style={[styles.actionPillBtn, hasMannequin && styles.mannequinPillActive]}
            onPress={() => {
              triggerHaptic('light');
              onOpenMannequin();
            }}
            activeOpacity={0.7}
          >
            <User size={15} color={hasMannequin ? '#FFFFFF' : '#18181B'} />
            <Text style={[styles.actionPillText, hasMannequin && styles.mannequinPillTextActive]}>
              Figur
            </Text>
          </TouchableOpacity>

          {/* AI Stylist Review Button */}
          <TouchableOpacity
            style={[styles.actionPillBtn, styles.aiPillBtn]}
            onPress={() => {
              triggerHaptic('medium');
              onOpenStylist();
            }}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color="#8B5CF6" />
            <Text style={[styles.actionPillText, { color: '#8B5CF6' }]}>Stylist</Text>
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
            <ShoppingBag size={15} color="#18181B" />
          </TouchableOpacity>

          {/* Toggle Dot Grid */}
          <TouchableOpacity
            style={[styles.actionIconBtn, gridVisible && styles.actionIconBtnActive]}
            onPress={() => {
              triggerHaptic('light');
              onToggleGrid();
            }}
            activeOpacity={0.7}
          >
            <Grid size={16} color={gridVisible ? '#18181B' : '#A1A1AA'} />
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
            <Share size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  outfitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    maxWidth: '38%',
  },
  outfitTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  mannequinPillActive: {
    backgroundColor: '#18181B',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#18181B',
  },
  mannequinPillTextActive: {
    color: '#FFFFFF',
  },
  aiPillBtn: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  wardrobeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnActive: {
    backgroundColor: '#E4E4E7',
  },
  exportBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
