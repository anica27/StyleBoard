import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { TouchCanvas } from '../src/components/Canvas/TouchCanvas';
import { QuickActionToolbar } from '../src/components/Canvas/QuickActionToolbar';
import { HeaderBar } from '../src/components/UI/HeaderBar';
import { WardrobeDrawer } from '../src/components/Wardrobe/WardrobeDrawer';
import { OutfitManagerModal } from '../src/components/Outfits/OutfitManagerModal';
import { ImageCropModal } from '../src/components/Crop/ImageCropModal';
import { ExportModal } from '../src/components/UI/ExportModal';
import { MannequinSelectorModal } from '../src/components/Mannequin/MannequinSelectorModal';
import { StylistChatDrawer } from '../src/components/Chat/StylistChatDrawer';
import { AISettingsModal } from '../src/components/UI/AISettingsModal';
import { CanvasItem, Moodboard, WardrobeItem } from '../src/types';
import {
  loadStoredWardrobe,
  saveStoredWardrobe,
  loadStoredBoards,
  saveStoredBoards,
  loadActiveBoardId,
  saveActiveBoardId,
} from '../src/services/storage';
import { triggerHaptic } from '../src/services/haptics';
import { aiIsolateClothingItem } from '../src/services/aiService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StyleBoardScreen() {
  const [loading, setLoading] = useState(true);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [boards, setBoards] = useState<Moodboard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // UI state
  const [gridVisible, setGridVisible] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
  const [isOutfitsOpen, setIsOutfitsOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isMannequinOpen, setIsMannequinOpen] = useState(false);
  const [isStylistOpen, setIsStylistOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [exportedImageUri, setExportedImageUri] = useState<string | null>(null);

  const canvasRef = useRef<any>(null);

  // 1. Initial Data Loading
  useEffect(() => {
    const initApp = async () => {
      try {
        const loadedWardrobe = await loadStoredWardrobe();
        setWardrobe(loadedWardrobe);

        const loadedBoards = await loadStoredBoards(loadedWardrobe);
        setBoards(loadedBoards);

        const savedBoardId = await loadActiveBoardId(loadedBoards[0]?.id);
        setActiveBoardId(savedBoardId || loadedBoards[0]?.id || '');
      } catch (err) {
        console.error('Error during app initialization:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const updateBoardsState = (newBoards: Moodboard[]) => {
    setBoards(newBoards);
    saveStoredBoards(newBoards);
  };

  const updateWardrobeState = (newWardrobe: WardrobeItem[]) => {
    setWardrobe(newWardrobe);
    saveStoredWardrobe(newWardrobe);
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];
  const activeItems = activeBoard?.items || [];
  const selectedItem = activeItems.find((i) => i.id === selectedItemId) || null;
  const currentMannequin = activeItems.find((i) => i.isMannequin) || null;

  // 2. Canvas Item Mutations
  const handleUpdateItem = (
    id: string,
    updates: Partial<Pick<CanvasItem, 'x' | 'y' | 'scale' | 'rotation'>>
  ) => {
    if (!activeBoard) return;

    const nextItems = activeBoard.items.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });

    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
  };

  // Bring layer forward
  const handleBringForward = () => {
    if (!selectedItemId || !activeBoard) return;
    const currentItem = activeBoard.items.find((i) => i.id === selectedItemId);
    if (!currentItem || currentItem.isMannequin) return; // Mannequin stays in background

    const maxZ = Math.max(...activeBoard.items.map((i) => i.zIndex), 1);
    const nextItems = activeBoard.items.map((i) =>
      i.id === selectedItemId ? { ...i, zIndex: maxZ + 1 } : i
    );

    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
  };

  // Send layer backward
  const handleSendBackward = () => {
    if (!selectedItemId || !activeBoard) return;
    const currentItem = activeBoard.items.find((i) => i.id === selectedItemId);
    if (!currentItem || currentItem.isMannequin) return; // Mannequin stays in background

    // Clothes are never pushed below zIndex: 1 so they never slip behind the mannequin
    const nonMannequinZ = activeBoard.items.filter((i) => !i.isMannequin).map((i) => i.zIndex);
    const minZ = Math.min(...nonMannequinZ, 1);
    const nextItems = activeBoard.items.map((i) =>
      i.id === selectedItemId ? { ...i, zIndex: Math.max(1, minZ - 1) } : i
    );

    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
  };

  // Duplicate item on canvas
  const handleDuplicateItem = () => {
    if (!selectedItem || !activeBoard) return;

    const maxZ = Math.max(...activeBoard.items.map((i) => i.zIndex), 0);
    const newItem: CanvasItem = {
      ...selectedItem,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: selectedItem.x + 24,
      y: selectedItem.y + 24,
      zIndex: maxZ + 1,
    };

    const nextItems = [...activeBoard.items, newItem];
    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
    setSelectedItemId(newItem.id);
  };

  // Flip item horizontally
  const handleFlipHorizontal = () => {
    if (!selectedItem || !activeBoard) return;

    const nextItems = activeBoard.items.map((i) =>
      i.id === selectedItem.id ? { ...i, flippedX: !i.flippedX } : i
    );

    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
  };

  // Delete item from canvas
  const handleDeleteItem = () => {
    if (!selectedItemId || !activeBoard) return;

    const nextItems = activeBoard.items.filter((i) => i.id !== selectedItemId);
    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
    setSelectedItemId(null);
  };

  // Apply manual crop result
  const handleApplyCrop = (
    itemId: string,
    newUri: string,
    width: number,
    height: number
  ) => {
    if (!activeBoard) return;

    const nextItems = activeBoard.items.map((item) => {
      if (item.id === itemId) {
        const aspect = width / Math.max(1, height);
        const newDisplayWidth = item.width;
        const newDisplayHeight = item.width / aspect;

        return {
          ...item,
          originalUri: item.originalUri || item.uri,
          uri: newUri,
          width: newDisplayWidth,
          height: newDisplayHeight,
        };
      }
      return item;
    });

    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
  };

  // Gemini AI Smart Cutout / Isolator
  const handleAICrop = async () => {
    if (!selectedItem || !activeBoard) return;

    try {
      setIsAiProcessing(true);
      triggerHaptic('medium');

      const sourceUri = selectedItem.originalUri || selectedItem.uri;
      const result = await aiIsolateClothingItem(sourceUri);

      // Apply cropped result to canvas item
      handleApplyCrop(selectedItem.id, result.uri, result.width, result.height);

      triggerHaptic('success');
      Alert.alert(
        '✨ KI-Zuschnitt erfolgreich',
        result.stylingTip
          ? `Erkannt: ${result.detectedName || 'Kleidungsstück'}\n\nTipp: ${result.stylingTip}`
          : 'Das Kleidungsstück wurde präzise freigestellt.'
      );
    } catch (err: any) {
      console.error('AI Crop failed:', err);
      triggerHaptic('error');
      if (err?.message?.includes('Kein API-Key')) {
        setIsAiSettingsOpen(true);
      } else {
        Alert.alert('KI-Fehler', err?.message || 'Zuschnitt mit KI fehlgeschlagen.');
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 3. Mannequin Operations (Hinzufügen & Löschen)
  const handleAddMannequin = (
    type: 'dressform' | 'female' | 'male' | 'custom',
    uri: string,
    width: number,
    height: number
  ) => {
    if (!activeBoard) return;

    // Remove existing mannequin if present
    const nonMannequinItems = activeBoard.items.filter((i) => !i.isMannequin);

    const aspect = width / Math.max(1, height);
    const targetW = 240;
    const targetH = targetW / aspect;

    const newMannequinItem: CanvasItem = {
      id: `mannequin_${Date.now()}`,
      uri,
      originalUri: uri,
      x: SCREEN_WIDTH / 2 - targetW / 2,
      y: 70,
      width: targetW,
      height: targetH,
      scale: 1,
      rotation: 0,
      zIndex: 0, // place in background behind clothing
      isMannequin: true,
      mannequinType: type,
    };

    const nextItems = [newMannequinItem, ...nonMannequinItems];
    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
    setSelectedItemId(newMannequinItem.id);
  };

  const handleRemoveMannequin = () => {
    if (!activeBoard) return;

    const nextItems = activeBoard.items.filter((i) => !i.isMannequin);
    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
    if (selectedItem?.isMannequin) {
      setSelectedItemId(null);
    }
  };

  // 4. Wardrobe Interactions
  const handlePlaceFromWardrobe = (item: WardrobeItem) => {
    if (!activeBoard) return;

    const maxZ = Math.max(...activeBoard.items.map((i) => i.zIndex), 0);
    const targetW = 180;
    const aspect = item.width / Math.max(1, item.height);
    const targetH = targetW / aspect;

    const newItem: CanvasItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wardrobeItemId: item.id,
      uri: item.uri,
      originalUri: item.uri,
      x: SCREEN_WIDTH / 2 - targetW / 2 + (Math.random() * 30 - 15),
      y: SCREEN_HEIGHT / 3 - targetH / 2 + (Math.random() * 30 - 15),
      width: targetW,
      height: targetH,
      scale: 1,
      rotation: 0,
      zIndex: maxZ + 1,
    };

    const nextItems = [...activeBoard.items, newItem];
    const updatedBoards = boards.map((b) =>
      b.id === activeBoard.id ? { ...b, items: nextItems, updatedAt: Date.now() } : b
    );
    updateBoardsState(updatedBoards);
    setSelectedItemId(newItem.id);
  };

  const handleAddWardrobeItem = (newItem: WardrobeItem) => {
    const nextWardrobe = [newItem, ...wardrobe];
    updateWardrobeState(nextWardrobe);
  };

  const handleUpdateWardrobeItem = (
    itemId: string,
    updates: Partial<Pick<WardrobeItem, 'name' | 'category' | 'uri'>>
  ) => {
    const nextWardrobe = wardrobe.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updates };
      }
      return item;
    });
    updateWardrobeState(nextWardrobe);
  };

  const handleDeleteWardrobeItem = (itemId: string) => {
    const nextWardrobe = wardrobe.filter((w) => w.id !== itemId);
    updateWardrobeState(nextWardrobe);
  };

  // 5. Board / Outfit Management
  const handleSelectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    saveActiveBoardId(boardId);
    setSelectedItemId(null);
  };

  const handleCreateBoard = (title: string) => {
    const newBoard: Moodboard = {
      id: `board_${Date.now()}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
    };
    const nextBoards = [newBoard, ...boards];
    updateBoardsState(nextBoards);
    setActiveBoardId(newBoard.id);
    saveActiveBoardId(newBoard.id);
    setSelectedItemId(null);
  };

  const handleDuplicateBoard = (sourceBoardId: string) => {
    const source = boards.find((b) => b.id === sourceBoardId);
    if (!source) return;

    const clonedItems: CanvasItem[] = source.items.map((i) => ({
      ...i,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    }));

    const duplicatedBoard: Moodboard = {
      id: `board_${Date.now()}`,
      title: `${source.title} (Kopie)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: clonedItems,
    };

    const nextBoards = [duplicatedBoard, ...boards];
    updateBoardsState(nextBoards);
    setActiveBoardId(duplicatedBoard.id);
    saveActiveBoardId(duplicatedBoard.id);
    setSelectedItemId(null);
  };

  const handleRenameBoard = (boardId: string, newTitle: string) => {
    const nextBoards = boards.map((b) =>
      b.id === boardId ? { ...b, title: newTitle, updatedAt: Date.now() } : b
    );
    updateBoardsState(nextBoards);
  };

  const handleDeleteBoard = (boardId: string) => {
    const nextBoards = boards.filter((b) => b.id !== boardId);
    updateBoardsState(nextBoards);
    if (activeBoardId === boardId && nextBoards.length > 0) {
      setActiveBoardId(nextBoards[0].id);
      saveActiveBoardId(nextBoards[0].id);
    }
  };

  // 6. Clean Moodboard Export
  const handleExportMoodboard = async () => {
    try {
      setSelectedItemId(null);
      setIsExporting(true);
      triggerHaptic('medium');

      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!canvasRef.current) {
        setIsExporting(false);
        return;
      }

      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      setIsExporting(false);
      setExportedImageUri(uri);
    } catch (err: any) {
      setIsExporting(false);
      console.error('Failed to export canvas:', err);
      Alert.alert('Export Fehler', err?.message || 'Moodboard konnte nicht gerendert werden.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#18181B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <HeaderBar
        boardTitle={activeBoard?.title || 'StyleBoard'}
        gridVisible={gridVisible}
        hasMannequin={!!currentMannequin}
        onOpenOutfits={() => setIsOutfitsOpen(true)}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
        onOpenMannequin={() => setIsMannequinOpen(true)}
        onOpenStylist={() => setIsStylistOpen(true)}
        onOpenSettings={() => setIsAiSettingsOpen(true)}
        onToggleGrid={() => setGridVisible((v) => !v)}
        onExport={handleExportMoodboard}
      />

      {/* Interactive Touch Canvas */}
      <TouchCanvas
        ref={canvasRef}
        items={activeItems}
        selectedItemId={selectedItemId}
        gridVisible={gridVisible}
        isExporting={isExporting}
        onSelectItem={(id) => setSelectedItemId(id)}
        onUpdateItem={handleUpdateItem}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
      />

      {/* Floating Quick Action Overlay when element is selected */}
      <QuickActionToolbar
        visible={!!selectedItemId && !isExporting}
        isMannequin={selectedItem?.isMannequin}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onCrop={() => setIsCropOpen(true)}
        onAICrop={handleAICrop}
        onDuplicate={handleDuplicateItem}
        onFlipHorizontal={handleFlipHorizontal}
        onDelete={handleDeleteItem}
        onDeselect={() => setSelectedItemId(null)}
      />

      {/* Kleiderschrank (Wardrobe Drawer) */}
      <WardrobeDrawer
        visible={isWardrobeOpen}
        wardrobe={wardrobe}
        onClose={() => setIsWardrobeOpen(false)}
        onSelectItem={handlePlaceFromWardrobe}
        onAddItem={handleAddWardrobeItem}
        onUpdateItem={handleUpdateWardrobeItem}
        onDeleteItem={handleDeleteWardrobeItem}
      />

      {/* Outfit Manager / Gallery Modal */}
      <OutfitManagerModal
        visible={isOutfitsOpen}
        boards={boards}
        activeBoardId={activeBoardId}
        onClose={() => setIsOutfitsOpen(false)}
        onSelectBoard={handleSelectBoard}
        onCreateBoard={handleCreateBoard}
        onDuplicateBoard={handleDuplicateBoard}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
      />

      {/* Mannequin / Figur Modal */}
      <MannequinSelectorModal
        visible={isMannequinOpen}
        currentMannequin={currentMannequin}
        onClose={() => setIsMannequinOpen(false)}
        onAddMannequin={handleAddMannequin}
        onRemoveMannequin={handleRemoveMannequin}
      />

      {/* Interactive Stylist Chat Drawer */}
      <StylistChatDrawer
        visible={isStylistOpen}
        boardTitle={activeBoard?.title || 'Outfit'}
        items={activeItems}
        wardrobe={wardrobe}
        onClose={() => setIsStylistOpen(false)}
        onOpenSettings={() => setIsAiSettingsOpen(true)}
      />

      {/* Manual Rectangle Crop Modal */}
      <ImageCropModal
        visible={isCropOpen}
        item={selectedItem}
        onClose={() => setIsCropOpen(false)}
        onApplyCrop={handleApplyCrop}
      />

      {/* Clean Export Preview & Share/Save Modal */}
      <ExportModal
        visible={!!exportedImageUri}
        imageUri={exportedImageUri}
        boardTitle={activeBoard?.title || 'StyleBoard Outfit'}
        onClose={() => setExportedImageUri(null)}
      />

      {/* Local AI Settings Modal */}
      <AISettingsModal
        visible={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
