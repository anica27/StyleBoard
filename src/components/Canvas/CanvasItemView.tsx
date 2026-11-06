import React, { useEffect } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { CanvasItem } from '../../types';
import { triggerHaptic } from '../../services/haptics';

interface CanvasItemViewProps {
  item: CanvasItem;
  isSelected: boolean;
  isExporting?: boolean;
  onSelect: (id: string) => void;
  onUpdate: (
    id: string,
    updates: Partial<Pick<CanvasItem, 'x' | 'y' | 'scale' | 'rotation'>>
  ) => void;
}

export const CanvasItemView: React.FC<CanvasItemViewProps> = ({
  item,
  isSelected,
  isExporting = false,
  onSelect,
  onUpdate,
}) => {
  // Shared values for high-performance 60fps animations
  const translateX = useSharedValue(item.x);
  const translateY = useSharedValue(item.y);
  const scale = useSharedValue(item.scale);
  const rotation = useSharedValue(item.rotation);

  const startX = useSharedValue(item.x);
  const startY = useSharedValue(item.y);
  const startScale = useSharedValue(item.scale);
  const startRotation = useSharedValue(item.rotation);

  // Sync external state changes (e.g. from duplication or reordering)
  useEffect(() => {
    translateX.value = item.x;
    translateY.value = item.y;
    scale.value = item.scale;
    rotation.value = item.rotation;
  }, [item.x, item.y, item.scale, item.rotation]);

  const notifySelect = () => {
    triggerHaptic('selection');
    onSelect(item.id);
  };

  const notifyChange = (x: number, y: number, s: number, r: number) => {
    onUpdate(item.id, { x, y, scale: s, rotation: r });
  };

  // 1-Finger Drag (Pan)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(notifySelect)();
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      runOnJS(triggerHaptic)('light');
      runOnJS(notifyChange)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // Pinch-to-Zoom (Scale)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
      runOnJS(notifySelect)();
    })
    .onUpdate((event) => {
      // Clamp scale between 0.25 and 4.0
      const nextScale = Math.max(0.25, Math.min(startScale.value * event.scale, 4.0));
      scale.value = nextScale;
    })
    .onEnd(() => {
      runOnJS(triggerHaptic)('light');
      runOnJS(notifyChange)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // Two-Finger Rotation
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      startRotation.value = rotation.value;
      runOnJS(notifySelect)();
    })
    .onUpdate((event) => {
      rotation.value = startRotation.value + event.rotation;
    })
    .onEnd(() => {
      runOnJS(triggerHaptic)('light');
      runOnJS(notifyChange)(
        translateX.value,
        translateY.value,
        scale.value,
        rotation.value
      );
    });

  // Tap gesture to select without dragging
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(notifySelect)();
  });

  // Simultaneous multi-touch gestures (Drag + Pinch + Rotate + Tap)
  const simultaneousGestures = Gesture.Simultaneous(
    tapGesture,
    panGesture,
    pinchGesture,
    rotationGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation.value}rad` },
        { scale: scale.value },
        { scaleX: item.flippedX ? -1 : 1 },
      ],
      zIndex: item.zIndex,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: item.width,
          height: item.height,
        },
        animatedStyle,
      ]}
    >
      <GestureDetector gesture={simultaneousGestures}>
        <View style={styles.touchArea}>
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Selection indicator frame - hidden during export */}
          {isSelected && !isExporting && (
            <View style={styles.selectionBorder} pointerEvents="none">
              <View style={[styles.handleDot, styles.dotTL]} />
              <View style={[styles.handleDot, styles.dotTR]} />
              <View style={[styles.handleDot, styles.dotBL]} />
              <View style={[styles.handleDot, styles.dotBR]} />
            </View>
          )}
        </View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: '#18181B',
    borderStyle: 'dashed',
    borderRadius: 6,
  },
  handleDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#18181B',
  },
  dotTL: {
    top: -5,
    left: -5,
  },
  dotTR: {
    top: -5,
    right: -5,
  },
  dotBL: {
    bottom: -5,
    left: -5,
  },
  dotBR: {
    bottom: -5,
    right: -5,
  },
});
