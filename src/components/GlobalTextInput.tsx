import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TextInputProps, 
  Text 
} from 'react-native';

// Si tienes un archivo de temas, usa COLORS. De lo contrario, usamos los hex aquí.
const COLORS = {
  primary: '#3B82F6',     // Color de enfoque
  border: '#E2E8F0',      // Borde normal
  inputBg: '#F1F5F9',     // Fondo grisáceo
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
};

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

const GlobalTextInput = ({ label, style, onFocus, onBlur, ...props }: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label.toUpperCase()}
        </Text>
      )}
      
      <View 
        style={[
          styles.inputWrapper, 
          isFocused && styles.inputWrapperFocused // Aplica borde azul al enfocar
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    // Sombra suave para evitar el efecto "volador"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary, // Resalta el borde al estar activo
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF', // Opcional: fondo blanco al escribir
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 0, // Evita desajustes en Android
  },
});

export default GlobalTextInput;