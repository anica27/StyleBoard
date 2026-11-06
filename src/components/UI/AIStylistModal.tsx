import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, Star, Lightbulb, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { AIStylistReview, aiReviewOutfitComposition } from '../../services/aiService';
import { CanvasItem, WardrobeItem } from '../../types';
import { triggerHaptic } from '../../services/haptics';

interface AIStylistModalProps {
  visible: boolean;
  boardTitle: string;
  items: CanvasItem[];
  wardrobe: WardrobeItem[];
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const AIStylistModal: React.FC<AIStylistModalProps> = ({
  visible,
  boardTitle,
  items,
  wardrobe,
  onClose,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<AIStylistReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nonMannequinItems = items.filter((i) => !i.isMannequin);
  const hasMannequin = items.some((i) => i.isMannequin);

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      triggerHaptic('medium');

      const itemsForReview = nonMannequinItems.map((item) => {
        const matchingWardrobe = wardrobe.find((w) => w.id === item.wardrobeItemId);
        return {
          name: matchingWardrobe?.name || 'Kleidungsstück',
          category: matchingWardrobe?.category || 'tops',
        };
      });

      const result = await aiReviewOutfitComposition(
        boardTitle,
        itemsForReview,
        hasMannequin
      );
      setReview(result);
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Stylist error:', err);
      setError(err?.message || 'KI-Stylist konnte nicht geladen werden.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  // Run on open if no review yet
  React.useEffect(() => {
    if (visible && !review && !loading) {
      runAnalysis();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Sparkles size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>Gemini AI Stylist</Text>
                <Text style={styles.subtitle}>Smarte Outfit-Analyse & Styling-Tipps</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#18181B" />
                <Text style={styles.loadingTitle}>Gemini analysiert dein Outfit...</Text>
                <Text style={styles.loadingSubtitle}>
                  Prüft Farbharmonie, Schnitte und Silhouette
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Hinweis</Text>
                <Text style={styles.errorText}>{error}</Text>
                {onOpenSettings && (
                  <TouchableOpacity
                    style={[styles.retryBtn, { backgroundColor: '#18181B', marginTop: 4 }]}
                    onPress={() => {
                      onClose();
                      onOpenSettings();
                    }}
                  >
                    <Text style={[styles.retryBtnText, { color: '#FFFFFF' }]}>API-Key eingeben</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.retryBtn} onPress={runAnalysis}>
                  <RotateCcw size={16} color="#18181B" />
                  <Text style={styles.retryBtnText}>Erneut versuchen</Text>
                </TouchableOpacity>
              </View>
            ) : review ? (
              <View style={styles.reviewContainer}>
                {/* Score & Vibe Card */}
                <View style={styles.vibeCard}>
                  <View style={styles.vibeBadge}>
                    <Text style={styles.vibeBadgeText}>Style-Vibe</Text>
                  </View>
                  <Text style={styles.vibeTitle}>{review.vibe}</Text>
                  <View style={styles.scoreRow}>
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.scoreText}>
                      Match-Rating: <Text style={{ fontWeight: '700' }}>{review.score} / 10</Text>
                    </Text>
                  </View>
                  <Text style={styles.reviewDescription}>{review.review}</Text>
                </View>

                {/* Strengths */}
                {review.strengths && review.strengths.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <Text style={styles.sectionHeaderTitle}>Stärken des Looks</Text>
                    </View>
                    {review.strengths.map((str, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{str}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recommendations */}
                {review.recommendations && review.recommendations.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Lightbulb size={16} color="#D97706" />
                      <Text style={styles.sectionHeaderTitle}>Stylist-Empfehlungen</Text>
                    </View>
                    {review.recommendations.map((rec, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, { backgroundColor: '#D97706' }]} />
                        <Text style={styles.bulletText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={runAnalysis}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color="#71717A" />
                  <Text style={styles.refreshBtnText}>Neu bewerten</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    maxHeight: '86%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 16,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#71717A',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  reviewContainer: {
    gap: 14,
    paddingBottom: 20,
  },
  vibeCard: {
    backgroundColor: '#FBFBFC',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vibeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  vibeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  vibeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 13,
    color: '#3F3F46',
  },
  reviewDescription: {
    fontSize: 13,
    color: '#52525B',
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#3F3F46',
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  refreshBtnText: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
});
