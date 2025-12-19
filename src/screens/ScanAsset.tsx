import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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

  if (!permission) return <View style={styles.centered}><ActivityIndicator size="large" color="#1E88E5" /></View>;
  
  if (!permission.granted) return (
    <View style={styles.centered}>
      {/* CORREGIDO: "camera-outline" es un nombre válido garantizado */}
      <Ionicons name="camera-outline" size={60} color="#ccc" />
      <Text style={styles.errorText}>No se concedió acceso a la cámara</Text>
      <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
        <Text style={styles.btnPermisoText}>Permitir Acceso</Text>
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
              <View style={styles.focusedContainer}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {loading && <ActivityIndicator size="large" color="#FFF" />}
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={styles.unfocusedContainer}>
              <Text style={styles.instructionText}>Escanea el código QR del activo</Text>
            </View>
          </View>
        </CameraView>
      )}

      {message && !loading && (
        <View style={styles.messageBox}>
          <Ionicons name="alert-circle" size={20} color="#FFF" style={{ marginRight: 10 }} />
          <Text style={styles.messageText}>{message}</Text>
          <TouchableOpacity onPress={() => { setScanned(false); setMessage(null); }}>
             <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFF", padding: 20 },
  overlay: { flex: 1, backgroundColor: "transparent" },
  unfocusedContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  middleRow: { flexDirection: "row", height: 250 },
  focusedContainer: { width: 250, backgroundColor: "transparent", justifyContent: "center", alignItems: "center" },
  corner: { position: "absolute", width: 40, height: 40, borderColor: "#1E88E5", borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructionText: { color: "#FFF", fontSize: 16, fontWeight: "600", marginTop: 20 },
  messageBox: { position: "absolute", bottom: 50, left: 20, right: 20, backgroundColor: "rgba(0,0,0,0.85)", padding: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  messageText: { color: "white", flex: 1, fontSize: 14 },
  retryText: { color: "#1E88E5", fontWeight: "bold", marginLeft: 10 },
  errorText: { marginTop: 15, fontSize: 16, color: "#64748B", textAlign: 'center' },
  btnPermiso: { marginTop: 20, backgroundColor: "#1E88E5", padding: 12, borderRadius: 8 },
  btnPermisoText: { color: "#FFF", fontWeight: "700" }
});