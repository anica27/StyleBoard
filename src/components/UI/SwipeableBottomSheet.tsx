import React, { useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { triggerHaptic } from '../../services/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: any;
}

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  visible,
  onClose,
  children,
  contentStyle,
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible]);

  const handleDismiss = () => {
    triggerHaptic('light');
    onClose();
  };

  // Pan gesture for dragging the sheet downwards
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow downward dragging
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged down past 100px or flicked down with velocity
      if (event.translationY > 100 || event.velocityY > 600) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 }, () => {
          runOnJS(handleDismiss)();
        });
      } else {
        // Snap back smoothly
        translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Backdrop touchable to tap outside */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Swipeable Animated Sheet */}
        <Animated.View style={[styles.sheetContent, contentStyle, animatedStyle]}>
          {/* Draggable Handle Area */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleHitSlop}>
              <View style={styles.handleBar} />
            </View>
          </GestureDetector>

          {children}
        </Animated.View>
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
  backdropTouchable: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleHitSlop: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D4D4D8',
  },
});
