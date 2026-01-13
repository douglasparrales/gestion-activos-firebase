// src/components/AppText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { COLORS } from '../styles/theme';

interface Props extends TextProps {
  bold?: boolean;
  size?: number;
  color?: string;
}

export const AppText = ({ children, bold, size, color, style, ...props }: Props) => {
  return (
    <Text 
      style={[
        { 
          color: color || COLORS.textPrimary, // Si no le das color, usa el azul oscuro por defecto
          fontSize: size || 14,
          fontWeight: bold ? '700' : '400',
        },
        style
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};