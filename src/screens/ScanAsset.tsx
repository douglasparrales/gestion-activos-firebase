import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { StackNavigationProp } from "@react-navigation/stack";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";

import { Asset } from "../types/Asset";
import { getAsset } from "../api/assets";

type RootStackParamList = {
  AddAsset: { assetId?: number };
  ScanAsset: undefined;
  AssetDetail: { assetId: number };
  Activos: {
    screen: "AddAsset" | "AssetList" | "AssetDetail";
    params?: any;
  };
  // Asumo que el navegador de pestañas se llama 'Tabs'
  Tabs: {
    screen: "Inicio" | "Lista" | "Escanear" | "Agregar";
    params?: any;
  };
};

type ScanAssetScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ScanAsset"
>;

type Props = {
  navigation: ScanAssetScreenNavigationProp;
};

export default function ScanAsset({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState(true);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  useFocusEffect(
    React.useCallback(() => {
      setActiveCamera(true); // activa la cámara al enfocar la pantalla
      return () => setActiveCamera(false); // desactiva la cámara al salir
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setLoading(true);

    // ✅ CORRECCIÓN TS: Declarar 'existente' y 'assetIdNumber' en el ámbito de la función
    let existente: Asset | null = null;
    let assetIdNumber: number | null = null;

    try {
      const qrValue = String(data).trim();
      console.log("🔍 Escaneado:", qrValue);

      if (!isNaN(Number(qrValue))) {
        assetIdNumber = Number(qrValue);
        existente = await getAsset(assetIdNumber);
      }

      if (existente) {
        console.log("✅ Activo encontrado:", existente.id);
        setMessage(`Activo encontrado: ${String(existente.nombre)}`);

        // 1. Disparar la navegación.
        // 🚀 CORRECCIÓN DE NAVEGACIÓN: Cambiado "Activos" a "Tabs" (el nombre del Navigator)
        navigation.navigate("Tabs", {
          screen: "Agregar", // Nombre de la pestaña de edición
          params: { assetId: existente.id },
        });

        // 2. Si la navegación es exitosa, detenemos la ejecución.
        return;

      } else {
        console.log("❌ QR no corresponde a ningún activo.");
        setMessage("Este QR no está asociado a ningún activo.");
      }
    } catch (error) {
      console.error("❌ Error al procesar QR:", error);
      setMessage("Error al procesar QR.");
    } finally {
      // ✅ 'existente' es accesible aquí y garantiza que 'loading' solo se desactive
      // si no se ejecutó la navegación.
      if (!existente) {
        setLoading(false);
      }
    }
  };

  if (!permission) return <Text>Solicitando permiso de cámara...</Text>;
  if (!permission.granted) return <Text>No se concedió acceso a la cámara.</Text>;

  return (
    <View style={styles.container}>
      {!scanned && activeCamera && isFocused && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.text}>Procesando...</Text>
        </View>
      )}

      {scanned && !loading && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setScanned(false);
            setMessage(null);
          }}
        >
          <Text style={styles.resetText}>🔄 Escanear otro QR</Text>
        </TouchableOpacity>
      )}

      {message && !loading && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 18,
    marginTop: 10,
  },
  message: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#00000099",
    color: "white",
    padding: 10,
    borderRadius: 8,
  },
  resetButton: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
  },
  resetText: {
    color: "white",
    fontSize: 16,
  },
});