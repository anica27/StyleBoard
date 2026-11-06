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

  // Save changes to storage
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
    if (!currentItem) return;

    const maxZ = Math.max(...activeBoard.items.map((i) => i.zIndex), 0);
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
    if (!currentItem) return;

    const minZ = Math.min(...activeBoard.items.map((i) => i.zIndex), 1);
    const nextItems = activeBoard.items.map((i) =>
      i.id === selectedItemId ? { ...i, zIndex: Math.max(0, minZ - 1) } : i
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
        // Calculate new display dimensions preserving natural aspect ratio
        const currentScale = item.scale;
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

  // 3. Wardrobe Interactions
  const handlePlaceFromWardrobe = (item: WardrobeItem) => {
    if (!activeBoard) return;

    const maxZ = Math.max(...activeBoard.items.map((i) => i.zIndex), 0);
    // Center element on canvas with default scaling
    const targetW = 200;
    const aspect = item.width / Math.max(1, item.height);
    const targetH = targetW / aspect;

    const newItem: CanvasItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      wardrobeItemId: item.id,
      uri: item.uri,
      originalUri: item.uri,
      x: SCREEN_WIDTH / 2 - targetW / 2 + (Math.random() * 40 - 20),
      y: SCREEN_HEIGHT / 3 - targetH / 2 + (Math.random() * 40 - 20),
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

  const handleDeleteWardrobeItem = (itemId: string) => {
    const nextWardrobe = wardrobe.filter((w) => w.id !== itemId);
    updateWardrobeState(nextWardrobe);
  };

  // 4. Board / Outfit Management
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

  // 1:1 Duplicate board (allows testing alternative shoes/accessories)
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

  // 5. Clean Moodboard Export
  const handleExportMoodboard = async () => {
    try {
      setSelectedItemId(null); // deselect to hide selection border
      setIsExporting(true); // hide dot-grid and action HUDs
      triggerHaptic('medium');

      // Allow one frame for state render
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
        onOpenOutfits={() => setIsOutfitsOpen(true)}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
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
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onCrop={() => setIsCropOpen(true)}
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
