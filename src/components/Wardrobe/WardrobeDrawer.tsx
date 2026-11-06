import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  Clipboard,
  X,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { WardrobeItem, ItemCategory, CATEGORIES } from '../../types';
import {
  pickFromGallery,
  takePhoto,
  importFromClipboard,
} from '../../services/imageService';
import { triggerHaptic } from '../../services/haptics';

interface WardrobeDrawerProps {
  visible: boolean;
  wardrobe: WardrobeItem[];
  onClose: () => void;
  onSelectItem: (item: WardrobeItem) => void;
  onAddItem: (newItem: WardrobeItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const WardrobeDrawer: React.FC<WardrobeDrawerProps> = ({
  visible,
  wardrobe,
  onClose,
  onSelectItem,
  onAddItem,
  onDeleteItem,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [isImporting, setIsImporting] = useState(false);

  // Filter wardrobe items
  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleImport = async (type: 'camera' | 'gallery' | 'clipboard') => {
    try {
      setIsImporting(true);
      triggerHaptic('medium');

      let result: { uri: string; width: number; height: number } | null = null;

      if (type === 'camera') {
        result = await takePhoto();
      } else if (type === 'gallery') {
        result = await pickFromGallery();
      } else if (type === 'clipboard') {
        result = await importFromClipboard();
      }

      if (result) {
        // Create new wardrobe item
        const categoryForNewItem: ItemCategory =
          selectedCategory !== 'all' ? selectedCategory : 'tops';

        const newItem: WardrobeItem = {
          id: `item_${Date.now()}`,
          name:
            type === 'clipboard'
              ? 'Screenshot Import'
              : type === 'camera'
              ? 'Foto Aufnahme'
              : 'Galerie Teil',
          category: categoryForNewItem,
          uri: result.uri,
          width: result.width,
          height: result.height,
          createdAt: Date.now(),
        };

        triggerHaptic('success');
        onAddItem(newItem);
        // Automatically place on the canvas!
        onSelectItem(newItem);
        onClose();
      }
    } catch (err: any) {
      console.warn('Import failed:', err);
      triggerHaptic('error');
      Alert.alert('Import Hinweis', err?.message || 'Bild konnte nicht importiert werden.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleItemPress = (item: WardrobeItem) => {
    triggerHaptic('selection');
    onSelectItem(item);
    onClose();
  };

  const handleDeletePress = (item: WardrobeItem) => {
    triggerHaptic('warning');
    Alert.alert(
      'Teil entfernen',
      `Möchtest du "${item.name}" wirklich aus deinem Kleiderschrank löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('error');
            onDeleteItem(item.id);
          },
        },
      ]
    );
  };

  // Divide into 2 columns for masonry feel
  const col1 = filteredItems.filter((_, idx) => idx % 2 === 0);
  const col2 = filteredItems.filter((_, idx) => idx % 2 === 1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Sheet Handle */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Kleiderschrank</Text>
              <Text style={styles.subtitle}>
                {wardrobe.length} Teile gespeichert • Tippe ein Teil zum Platzieren
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          {/* Import Actions Bar */}
          <View style={styles.importBar}>
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => handleImport('camera')}
              disabled={isImporting}
              activeOpacity={0.7}
            >
              <Camera size={18} color="#18181B" />
              <Text style={styles.importBtnText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => handleImport('gallery')}
              disabled={isImporting}
              activeOpacity={0.7}
            >
              <ImageIcon size={18} color="#18181B" />
              <Text style={styles.importBtnText}>Galerie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.importBtn, styles.clipboardBtn]}
              onPress={() => handleImport('clipboard')}
              disabled={isImporting}
              activeOpacity={0.7}
            >
              <Clipboard size={18} color="#18181B" />
              <Text style={styles.importBtnText}>Zwischenablage</Text>
            </TouchableOpacity>
          </View>

          {isImporting && (
            <View style={styles.importingBanner}>
              <ActivityIndicator size="small" color="#18181B" />
              <Text style={styles.importingText}>Bild wird offline verarbeitet...</Text>
            </View>
          )}

          {/* Category Filter Horizontal Scroll */}
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setSelectedCategory(cat.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 2-Column Masonry Grid */}
          <ScrollView style={styles.gridScrollView} showsVerticalScrollIndicator={false}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Sparkles size={32} color="#A1A1AA" />
                <Text style={styles.emptyTitle}>Noch keine Teile in dieser Kategorie</Text>
                <Text style={styles.emptySubtitle}>
                  Füge Fotos deiner Kleidung oder Screenshots aus Onlineshops per Kamera, Galerie
                  oder Zwischenablage hinzu.
                </Text>
              </View>
            ) : (
              <View style={styles.masonryContainer}>
                {/* Column 1 */}
                <View style={styles.column}>
                  {col1.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      onPress={() => handleItemPress(item)}
                      onLongPress={() => handleDeletePress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.cardCategory}>
                          {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteCardBtn}
                        onPress={() => handleDeletePress(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={13} color="#A1A1AA" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Column 2 */}
                <View style={styles.column}>
                  {col2.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      onPress={() => handleItemPress(item)}
                      onLongPress={() => handleDeletePress(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardImageContainer}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.cardImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.cardCategory}>
                          {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteCardBtn}
                        onPress={() => handleDeletePress(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={13} color="#A1A1AA" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContent: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
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
  importBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  importBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  clipboardBtn: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  importBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
  },
  importingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  importingText: {
    fontSize: 12,
    color: '#71717A',
  },
  categoryContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
  },
  categoryChipActive: {
    backgroundColor: '#18181B',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#71717A',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gridScrollView: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  cardCategory: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  deleteCardBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3F3F46',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
  },
});
