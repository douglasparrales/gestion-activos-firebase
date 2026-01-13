import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// --- SISTEMA DE DISEÑO GLOBAL ---
import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";

import { Asset } from "../types/Asset";
import { getAsset } from "../api/assets";

const { width } = Dimensions.get("window");

export default function ScanAsset({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState(true);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useFocusEffect(
    useCallback(() => {
      setActiveCamera(true);
      setScanned(false);
      setLoading(false);
      setMessage(null);
      return () => {
        setActiveCamera(false);
        setScanned(true); 
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setMessage(null);

    let existente: Asset | null = null;

    try {
      const qrValue = String(data).trim();
      
      if (!isNaN(Number(qrValue))) {
        const assetIdNumber = Number(qrValue);
        existente = await getAsset(assetIdNumber);
      }

      if (existente) {
        setActiveCamera(false);
        navigation.navigate("Tabs", {
          screen: "Agregar",
          params: { assetId: existente.id },
        });
      } else {
        setMessage("Este QR no está asociado a ningún activo registrado.");
        setLoading(false);
        setScanned(false);
      }
    } catch (error) {
      setMessage("Error al procesar el código.");
      setLoading(false);
      setScanned(false);
    }
  };

  // Pantalla de carga inicial
  if (!permission) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.secondary} />
    </View>
  );
  
  // Pantalla de solicitud de permisos
  if (!permission.granted) return (
    <View style={styles.centered}>
      <Ionicons name="camera-outline" size={80} color={COLORS.textMuted} />
      <AppText bold size={18} style={{ marginTop: 20 }}>Acceso a la cámara</AppText>
      <AppText color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: 10 }}>
        Necesitamos permiso para escanear los códigos QR de tus activos.
      </AppText>
      <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
        <AppText bold color={COLORS.white}>Permitir Acceso</AppText>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isFocused && activeCamera && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        >
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.middleRow}>
              <View style={styles.unfocusedContainer} />
              
              {/* CUADRO DE ENFOQUE */}
              <View style={styles.focusedContainer}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {loading && <ActivityIndicator size="large" color={COLORS.white} />}
              </View>
              
              <View style={styles.unfocusedContainer} />
            </View>
            
            <View style={styles.unfocusedContainer}>
              <AppText bold color={COLORS.white} size={16} style={styles.instructionText}>
                Escanea el código QR del activo
              </AppText>
              <AppText color="rgba(255,255,255,0.7)" size={12} style={{marginTop: 5}}>
                Alinea el código dentro del cuadro
              </AppText>
            </View>
          </View>
        </CameraView>
      )}

      {/* MENSAJE DE ERROR / NOTIFICACIÓN */}
      {message && !loading && (
        <View style={styles.messageBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="alert-circle" size={22} color={COLORS.white} style={{ marginRight: 10 }} />
            <AppText color={COLORS.white} size={13} style={{ flex: 1 }}>{message}</AppText>
          </View>
          <TouchableOpacity 
            onPress={() => { setScanned(false); setMessage(null); }}
            style={styles.retryButton}
          >
             <AppText bold color={COLORS.white} size={13}>Reintentar</AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: COLORS.background, 
    padding: 30 
  },
  overlay: { flex: 1, backgroundColor: "transparent" },
  unfocusedContainer: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.7)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  middleRow: { flexDirection: "row", height: 260 },
  focusedContainer: { 
    width: 260, 
    backgroundColor: "transparent", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  // ESQUINAS CON EL COLOR SECUNDARIO PARA COHERENCIA
  corner: { 
    position: "absolute", 
    width: 45, 
    height: 45, 
    borderColor: COLORS.secondary, 
    borderWidth: 5,
    borderRadius: 2
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  
  instructionText: { marginTop: 20 },
  
  messageBox: { 
    position: "absolute", 
    bottom: 40, 
    left: 20, 
    right: 20, 
    backgroundColor: "rgba(239, 68, 68, 0.95)", // Rojo error con transparencia
    padding: 16, 
    borderRadius: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  retryButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10
  },
  btnPermiso: { 
    marginTop: 30, 
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 30,
    paddingVertical: 15, 
    borderRadius: 12,
    elevation: 3
  }
});