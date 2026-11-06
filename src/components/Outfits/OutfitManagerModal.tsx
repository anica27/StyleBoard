import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Copy,
  Trash2,
  Check,
  Edit2,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { Moodboard } from '../../types';
import { triggerHaptic } from '../../services/haptics';
import { SwipeableBottomSheet } from '../UI/SwipeableBottomSheet';

interface OutfitManagerModalProps {
  visible: boolean;
  boards: Moodboard[];
  activeBoardId: string;
  onClose: () => void;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (title: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  onDeleteBoard: (boardId: string) => void;
}

export const OutfitManagerModal: React.FC<OutfitManagerModalProps> = ({
  visible,
  boards,
  activeBoardId,
  onClose,
  onSelectBoard,
  onCreateBoard,
  onDuplicateBoard,
  onRenameBoard,
  onDeleteBoard,
}) => {
  const insets = useSafeAreaInsets();
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleStartRename = (board: Moodboard) => {
    triggerHaptic('light');
    setEditingBoardId(board.id);
    setEditingTitle(board.title);
  };

  const handleSaveRename = (boardId: string) => {
    if (editingTitle.trim()) {
      triggerHaptic('success');
      onRenameBoard(boardId, editingTitle.trim());
    }
    setEditingBoardId(null);
  };

  const handleCreateSubmit = () => {
    const title = newBoardTitle.trim() || `Neues Outfit ${boards.length + 1}`;
    triggerHaptic('success');
    onCreateBoard(title);
    setNewBoardTitle('');
    setIsCreatingNew(false);
  };

  const handleDuplicate = (board: Moodboard) => {
    triggerHaptic('medium');
    onDuplicateBoard(board.id);
  };

  const handleDelete = (board: Moodboard) => {
    if (boards.length <= 1) {
      Alert.alert('Hinweis', 'Das letzte verbleibende Outfit kann nicht gelöscht werden.');
      return;
    }

    triggerHaptic('warning');
    Alert.alert(
      'Outfit löschen',
      `Möchtest du "${board.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('error');
            onDeleteBoard(board.id);
          },
        },
      ]
    );
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      contentStyle={[styles.sheetContent, { maxHeight: '82%', paddingBottom: Math.max(insets.bottom, 20) }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meine Outfits</Text>
          <Text style={styles.subtitle}>
            Verwalte Moodboards & erstelle Varianten per Duplizieren
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

          {/* Create New Outfit Input / Button */}
          <View style={styles.createNewContainer}>
            {isCreatingNew ? (
              <View style={styles.newInputRow}>
                <TextInput
                  style={styles.newTitleInput}
                  placeholder="z. B. Sommerhochzeit, Capsule Chic..."
                  value={newBoardTitle}
                  onChangeText={setNewBoardTitle}
                  autoFocus
                  placeholderTextColor="#A1A1AA"
                />
                <TouchableOpacity
                  style={styles.submitNewBtn}
                  onPress={handleCreateSubmit}
                  activeOpacity={0.7}
                >
                  <Check size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelNewBtn}
                  onPress={() => setIsCreatingNew(false)}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#71717A" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setIsCreatingNew(true);
                }}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#18181B" />
                <Text style={styles.createBtnText}>Neues Outfit-Board erstellen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List of Boards */}
          <ScrollView style={styles.boardsList} showsVerticalScrollIndicator={false}>
            {boards.map((board) => {
              const isActive = board.id === activeBoardId;
              const isRenaming = editingBoardId === board.id;

              return (
                <View
                  key={board.id}
                  style={[styles.boardCard, isActive && styles.boardCardActive]}
                >
                  <TouchableOpacity
                    style={styles.boardCardMain}
                    onPress={() => {
                      triggerHaptic('selection');
                      onSelectBoard(board.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.boardCardLeft}>
                      <View style={[styles.boardIconBox, isActive && styles.boardIconBoxActive]}>
                        <Layers size={20} color={isActive ? '#FFFFFF' : '#18181B'} />
                      </View>
                      <View style={styles.boardTextContainer}>
                        {isRenaming ? (
                          <View style={styles.renameRow}>
                            <TextInput
                              style={styles.renameInput}
                              value={editingTitle}
                              onChangeText={setEditingTitle}
                              autoFocus
                              selectTextOnFocus
                            />
                            <TouchableOpacity
                              onPress={() => handleSaveRename(board.id)}
                              style={styles.renameSaveBtn}
                            >
                              <Check size={16} color="#18181B" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.titleRow}>
                            <Text style={styles.boardTitle} numberOfLines={1}>
                              {board.title}
                            </Text>
                            {isActive && (
                              <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>Aktiv</Text>
                              </View>
                            )}
                          </View>
                        )}
                        <Text style={styles.boardMeta}>
                          {board.items.length}{' '}
                          {board.items.length === 1 ? 'Kleidungsstück' : 'Kleidungsstücke'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Actions on Board */}
                  <View style={styles.boardCardActions}>
                    {/* Duplicate 1:1 button */}
                    <TouchableOpacity
                      style={styles.boardActionBtn}
                      onPress={() => handleDuplicate(board)}
                      accessibilityLabel="Outfit duplizieren"
                      activeOpacity={0.7}
                    >
                      <Copy size={16} color="#18181B" />
                    </TouchableOpacity>

                    {/* Rename button */}
                    <TouchableOpacity
                      style={styles.boardActionBtn}
                      onPress={() => handleStartRename(board)}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={16} color="#71717A" />
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.boardActionBtn}
                      onPress={() => handleDelete(board)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
    </SwipeableBottomSheet>
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
    maxHeight: '80%',
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
    paddingVertical: 12,
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
  createNewContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  newInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newTitleInput: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#18181B',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  submitNewBtn: {
    backgroundColor: '#18181B',
    padding: 10,
    borderRadius: 12,
  },
  cancelNewBtn: {
    padding: 10,
  },
  boardsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  boardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 12,
    marginBottom: 10,
  },
  boardCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#18181B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  boardCardMain: {
    flex: 1,
  },
  boardCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardIconBoxActive: {
    backgroundColor: '#18181B',
  },
  boardTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  boardMeta: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
    paddingVertical: 2,
  },
  renameSaveBtn: {
    padding: 4,
  },
  boardCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boardActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
  },
});
