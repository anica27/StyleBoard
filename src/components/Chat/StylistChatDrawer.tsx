import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
} from 'lucide-react-native';
import { ChatMessage, CanvasItem, WardrobeItem } from '../../types';
import { aiChatWithStylist } from '../../services/aiService';
import { triggerHaptic } from '../../services/haptics';
import { SwipeableBottomSheet } from '../UI/SwipeableBottomSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StylistChatDrawerProps {
  visible: boolean;
  boardTitle: string;
  items: CanvasItem[];
  wardrobe: WardrobeItem[];
  onClose: () => void;
  onOpenSettings: () => void;
}

const QUICK_PROMPTS = [
  '🪩 Outfit für eine 90er Themenparty',
  '💍 Sommerhochzeit als Gast',
  '☕ Casual Chic fürs Wochenende',
  '💼 Modernes Business Casual',
  '✨ Was passt zu meinen Teilen auf dem Board?',
];

export const StylistChatDrawer: React.FC<StylistChatDrawerProps> = ({
  visible,
  boardTitle,
  items,
  wardrobe,
  onClose,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `Hallo! 👋 Ich bin dein persönlicher KI-Stylist.\n\nErzähl mir: Welchen Anlass planst du (z. B. eine 90er-Themenparty, ein Date oder eine Sommerhochzeit)? Ich stelle dir aus deinen Teilen im Kleiderschrank den perfekten Look zusammen! ✨`,
      timestamp: Date.now(),
    },
  ]);

  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 250);
    }
  }, [visible, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    triggerHaptic('light');
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const boardItemsContext = items
        .filter((i) => !i.isMannequin)
        .map((item) => {
          const w = wardrobe.find((w) => w.id === item.wardrobeItemId);
          return {
            name: w?.name || 'Kleidungsstück',
            category: w?.category || 'tops',
          };
        });

      const wardrobeContext = wardrobe.map((w) => ({
        name: w.name,
        category: w.category,
      }));

      const replyText = await aiChatWithStylist(nextMessages, {
        boardTitle,
        boardItems: boardItemsContext,
        wardrobeItems: wardrobeContext,
        hasMannequin: items.some((i) => i.isMannequin),
      });

      triggerHaptic('success');
      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: Date.now(),
      };
      setMessages([...nextMessages, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      triggerHaptic('error');
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: err?.message?.includes('Kein API-Key')
          ? '⚠️ Kein API-Key gefunden. Bitte trage deinen Google Gemini API-Key im Einstellungs-Zahnrad ein.'
          : `Entschuldige, ich konnte gerade keine Verbindung aufbauen (${err?.message || 'Fehler'}). Bitte prüfe deinen API-Key in den Einstellungen.`,
        timestamp: Date.now(),
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    triggerHaptic('light');
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        text: 'Bereit für den nächsten Look! Welchen Style oder Anlass möchtest du ausprobieren?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      height={SCREEN_HEIGHT * 0.86} // Große, geräumige Höhe (3x größer)
      contentStyle={[
        styles.sheetContent,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Sparkles size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>KI-Modeberater</Text>
            <Text style={styles.headerSubtitle}>
              Kennt deinen Kleiderschrank • {boardTitle}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleResetChat}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#71717A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} activeOpacity={0.7}>
            <X size={18} color="#71717A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List - fills remaining space */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                isUser ? styles.messageWrapperUser : styles.messageWrapperModel,
              ]}
            >
              {!isUser && (
                <View style={styles.modelAvatarSmall}>
                  <Bot size={13} color="#FFFFFF" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.bubbleUser : styles.bubbleModel,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.textUser : styles.textModel,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={styles.loadingWrapper}>
            <View style={styles.modelAvatarSmall}>
              <Bot size={13} color="#FFFFFF" />
            </View>
            <View style={[styles.messageBubble, styles.bubbleModel, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#18181B" />
              <Text style={styles.typingText}>Stylist stellt Look zusammen...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts Suggestions */}
      <View style={styles.quickPromptsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsScroll}
        >
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickPromptChip}
              onPress={() => handleSend(prompt)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="z. B. Was ziehe ich zur 90er-Party an?..."
            placeholderTextColor="#A1A1AA"
            multiline
            maxLength={350}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.7}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  messagesContainer: {
    paddingBottom: 14,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperModel: {
    justifyContent: 'flex-start',
  },
  modelAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#18181B',
    borderBottomRightRadius: 4,
  },
  bubbleModel: {
    backgroundColor: '#F4F4F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
  },
  textModel: {
    color: '#18181B',
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#71717A',
  },
  quickPromptsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  quickPromptsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#F4F4F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#18181B',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },
});
