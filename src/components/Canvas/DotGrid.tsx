import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

interface DotGridProps {
  dotColor?: string;
  dotSize?: number;
  spacing?: number;
  visible?: boolean;
}

export const DotGrid: React.FC<DotGridProps> = ({
  dotColor = '#D4D4D8',
  dotSize = 1.2,
  spacing = 24,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="dot-grid-pattern"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <Circle cx={spacing / 2} cy={spacing / 2} r={dotSize} fill={dotColor} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dot-grid-pattern)" />
      </Svg>
    </View>
  );
};
