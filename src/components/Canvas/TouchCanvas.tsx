import React, { forwardRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
} from 'react-native';
import { DotGrid } from './DotGrid';
import { CanvasItemView } from './CanvasItemView';
import { CanvasItem } from '../../types';
import { Sparkles, ShoppingBag } from 'lucide-react-native';

interface TouchCanvasProps {
  items: CanvasItem[];
  selectedItemId: string | null;
  gridVisible: boolean;
  isExporting?: boolean;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (
    id: string,
    updates: Partial<Pick<CanvasItem, 'x' | 'y' | 'scale' | 'rotation'>>
  ) => void;
  onOpenWardrobe?: () => void;
}

export const TouchCanvas = forwardRef<any, TouchCanvasProps>(
  (
    {
      items,
      selectedItemId,
      gridVisible,
      isExporting = false,
      onSelectItem,
      onUpdateItem,
      onOpenWardrobe,
    },
    ref
  ) => {
    // Sort items by zIndex so higher zIndex elements render on top
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

    return (
      <TouchableWithoutFeedback onPress={() => onSelectItem(null)}>
        <View style={styles.canvasContainer} ref={ref} collapsable={false}>
          {/* Subtle Dot Grid */}
          <DotGrid visible={gridVisible && !isExporting} />

          {/* Empty Board Placeholder */}
          {items.length === 0 && !isExporting && (
            <View style={styles.emptyContainer} pointerEvents="box-none">
              <View style={styles.emptyIconBox}>
                <Sparkles size={28} color="#71717A" />
              </View>
              <Text style={styles.emptyTitle}>Arbeitsfläche ist leer</Text>
              <Text style={styles.emptyText}>
                Füge Teile aus deinem Kleiderschrank hinzu oder importiere Screenshots.
              </Text>
              {onOpenWardrobe && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={onOpenWardrobe}
                  activeOpacity={0.7}
                >
                  <ShoppingBag size={16} color="#FFFFFF" />
                  <Text style={styles.emptyAddBtnText}>Kleiderschrank öffnen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Interactive Multi-Touch Canvas Items */}
          {sortedItems.map((item) => (
            <CanvasItemView
              key={item.id}
              item={item}
              isSelected={item.id === selectedItemId}
              isExporting={isExporting}
              onSelect={(id) => onSelectItem(id)}
              onUpdate={onUpdateItem}
            />
          ))}
        </View>
      </TouchableWithoutFeedback>
    );
  }
);

TouchCanvas.displayName = 'TouchCanvas';

const styles = StyleSheet.create({
  canvasContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 0,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
