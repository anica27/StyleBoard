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
  TextInput,
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
  Edit3,
  Check,
  Sparkles,
  Scissors,
  Wand2,
} from 'lucide-react-native';
import { WardrobeItem, ItemCategory, CATEGORIES } from '../../types';
import {
  pickFromGallery,
  takePhoto,
  importFromClipboard,
} from '../../services/imageService';
import { triggerHaptic } from '../../services/haptics';
import { SwipeableBottomSheet } from '../UI/SwipeableBottomSheet';

interface WardrobeDrawerProps {
  visible: boolean;
  wardrobe: WardrobeItem[];
  onClose: () => void;
  onSelectItem: (item: WardrobeItem) => void;
  onAddItem: (newItem: WardrobeItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<Pick<WardrobeItem, 'name' | 'category' | 'uri'>>) => void;
  onDeleteItem: (itemId: string) => void;
  onOpenAISettings?: () => void;
}

export const WardrobeDrawer: React.FC<WardrobeDrawerProps> = ({
  visible,
  wardrobe,
  onClose,
  onSelectItem,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onOpenAISettings,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [isImporting, setIsImporting] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ItemCategory>('tops');

  // New Item Confirm Modal State
  const [pendingImport, setPendingImport] = useState<{
    uri: string;
    width: number;
    height: number;
    type: 'camera' | 'gallery' | 'clipboard';
  } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingCategory, setPendingCategory] = useState<ItemCategory>('tops');

  // Filter wardrobe items
  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleStartImport = async (type: 'camera' | 'gallery' | 'clipboard') => {
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
        // Open confirmation dialog so user can select category and name
        const defaultCategory: ItemCategory =
          selectedCategory !== 'all' ? selectedCategory : 'tops';
        const defaultName =
          type === 'clipboard'
            ? 'Screenshot'
            : type === 'camera'
            ? 'Foto Aufnahme'
            : 'Neues Kleidungsstück';

        setPendingImport({ ...result, type });
        setPendingName(defaultName);
        setPendingCategory(defaultCategory);
      }
    } catch (err: any) {
      console.warn('Import failed:', err);
      triggerHaptic('error');
      Alert.alert('Import Hinweis', err?.message || 'Bild konnte nicht importiert werden.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmPendingImport = () => {
    if (!pendingImport) return;

    const newItem: WardrobeItem = {
      id: `item_${Date.now()}`,
      name: pendingName.trim() || 'Kleidungsstück',
      category: pendingCategory,
      uri: pendingImport.uri,
      width: pendingImport.width,
      height: pendingImport.height,
      createdAt: Date.now(),
    };

    triggerHaptic('success');
    onAddItem(newItem);
    onSelectItem(newItem);
    setPendingImport(null);
    onClose();
  };

  const handleStartEdit = (item: WardrobeItem) => {
    triggerHaptic('light');
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    triggerHaptic('success');
    onUpdateItem(editingItem.id, {
      name: editName.trim() || editingItem.name,
      category: editCategory,
    });
    setEditingItem(null);
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

  const col1 = filteredItems.filter((_, idx) => idx % 2 === 0);
  const col2 = filteredItems.filter((_, idx) => idx % 2 === 1);

  return (
    <>
      <SwipeableBottomSheet
        visible={visible}
        onClose={onClose}
        contentStyle={[styles.sheetContent, { maxHeight: '85%', paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Kleiderschrank</Text>
            <Text style={styles.subtitle}>
              {wardrobe.length} Teile • Wische nach unten oder tippe zum Platzieren
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
                onPress={() => handleStartImport('camera')}
                disabled={isImporting}
                activeOpacity={0.7}
              >
                <Camera size={18} color="#18181B" />
                <Text style={styles.importBtnText}>Kamera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.importBtn}
                onPress={() => handleStartImport('gallery')}
                disabled={isImporting}
                activeOpacity={0.7}
              >
                <ImageIcon size={18} color="#18181B" />
                <Text style={styles.importBtnText}>Galerie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.importBtn, styles.clipboardBtn]}
                onPress={() => handleStartImport('clipboard')}
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
                <Text style={styles.importingText}>Bild wird geladen...</Text>
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
                  <Text style={styles.emptyTitle}>Keine Teile in dieser Kategorie</Text>
                  <Text style={styles.emptySubtitle}>
                    Füge neue Teile hinzu oder verschiebe bestehende Kleidungsstücke hierher.
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
                        onLongPress={() => handleStartEdit(item)}
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

                        {/* Edit Button */}
                        <TouchableOpacity
                          style={styles.editCardBtn}
                          onPress={() => handleStartEdit(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit3 size={13} color="#18181B" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                          style={styles.deleteCardBtn}
                          onPress={() => handleDeletePress(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={13} color="#DC2626" />
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
                        onLongPress={() => handleStartEdit(item)}
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

                        {/* Edit Button */}
                        <TouchableOpacity
                          style={styles.editCardBtn}
                          onPress={() => handleStartEdit(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit3 size={13} color="#18181B" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                          style={styles.deleteCardBtn}
                          onPress={() => handleDeletePress(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
      </SwipeableBottomSheet>

      {/* MODAL 1: Edit Wardrobe Item (Name & Category Shift) */}
      <Modal visible={!!editingItem} animationType="fade" transparent>
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Kleidungsstück bearbeiten</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)} style={styles.closeBtn}>
                <X size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <View style={styles.editModalContent}>
                <View style={styles.editPreviewRow}>
                  <Image source={{ uri: editingItem.uri }} style={styles.editThumb} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Bezeichnung / Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="z. B. Wollmantel, Weite Jeans..."
                      placeholderTextColor="#A1A1AA"
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Kategorie zuweisen (Einsortieren):</Text>
                <View style={styles.categorySelectGrid}>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const isSelected = editCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChoiceChip, isSelected && styles.categoryChoiceChipSelected]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setEditCategory(cat.id);
                        }}
                      >
                        <Text style={[styles.categoryChoiceText, isSelected && styles.categoryChoiceTextSelected]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={styles.cancelActionBtn}
                    onPress={() => setEditingItem(null)}
                  >
                    <Text style={styles.cancelActionText}>Abbrechen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveActionBtn}
                    onPress={handleSaveEdit}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveActionText}>Speichern</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Confirm Pending Import (Choose category & name directly upon import) */}
      <Modal visible={!!pendingImport} animationType="fade" transparent>
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Neues Kleidungsstück einsortieren</Text>
                <Text style={styles.subtitle}>Wähle Name und Kategorie für dein Teil</Text>
              </View>
              <TouchableOpacity onPress={() => setPendingImport(null)} style={styles.closeBtn}>
                <X size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            {pendingImport && (
              <View style={styles.editModalContent}>
                <View style={styles.editPreviewRow}>
                  <Image source={{ uri: pendingImport.uri }} style={styles.editThumb} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Name / Bezeichnung</Text>
                    <TextInput
                      style={styles.textInput}
                      value={pendingName}
                      onChangeText={setPendingName}
                      placeholder="z. B. Kaschmirpullover..."
                      placeholderTextColor="#A1A1AA"
                      autoFocus
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>In welche Kategorie einsortieren?</Text>
                <View style={styles.categorySelectGrid}>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const isSelected = pendingCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChoiceChip, isSelected && styles.categoryChoiceChipSelected]}
                        onPress={() => {
                          triggerHaptic('selection');
                          setPendingCategory(cat.id);
                        }}
                      >
                        <Text style={[styles.categoryChoiceText, isSelected && styles.categoryChoiceTextSelected]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={styles.cancelActionBtn}
                    onPress={() => setPendingImport(null)}
                  >
                    <Text style={styles.cancelActionText}>Verwerfen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveActionBtn}
                    onPress={handleConfirmPendingImport}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveActionText}>Einsortieren & Platzieren</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
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
    maxHeight: '84%',
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
    paddingRight: 24,
  },
  cardCategory: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  editCardBtn: {
    position: 'absolute',
    top: 6,
    right: 34,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E4E4E7',
  },
  deleteCardBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E4E4E7',
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
  // Edit & Confirm Modal Styles
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  editModalContent: {},
  editPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  editThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#18181B',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  categorySelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  categoryChoiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  categoryChoiceChipSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  categoryChoiceText: {
    fontSize: 13,
    color: '#3F3F46',
    fontWeight: '500',
  },
  categoryChoiceTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  saveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  saveActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
