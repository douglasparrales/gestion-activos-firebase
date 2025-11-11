import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { StackNavigationProp } from "@react-navigation/stack";

import { Asset } from "../types/Asset";
import { addAsset, getAsset } from "../api/assets";

type RootStackParamList = {
  AddAsset: { assetId?: string };
  ScanAsset: undefined;
};

type ScanAssetScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScanAsset">;

type Props = {
  navigation: ScanAssetScreenNavigationProp;
};

export default function ScanAsset({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    setScanned(true);
    setLoading(true);
    setMessage("Procesando QR...");

    try {
      // Limpiamos el dato leído (puede ser un ID o cualquier texto)
      const qrValue = String(data).trim();

      console.log("🔍 Escaneado:", qrValue);

      // 1️⃣ Intentamos buscar si existe un activo con ese ID (solo si es numérico)
      let existente: Asset | null = null;

      if (!isNaN(Number(qrValue))) {
        existente = await getAsset(qrValue);
      }

      if (existente) {
        console.log("✅ Activo existente encontrado:", existente.id);
        setMessage(`Activo encontrado: ${existente.nombre}`);
        navigation.navigate("AddAsset", { assetId: existente.id });
      } else {
        console.log("🆕 QR no corresponde a activo existente. Creando nuevo...");

        const nuevoActivo: Asset = {
          id: "", // se genera automáticamente en addAsset()
          nombre: "Activo escaneado",
          categoria: "General",
          estado: "Disponible",
          ubicacion: "Sin asignar",
          fechaAdquisicion: new Date().toISOString().split("T")[0],
          fechaRegistro: new Date().toISOString(),
        };

        const nuevoId = await addAsset(nuevoActivo);
        console.log("✅ Activo nuevo creado con ID automático:", nuevoId);

        setMessage(`Activo nuevo creado (ID: ${nuevoId})`);
        navigation.navigate("AddAsset", { assetId: nuevoId });
      }
    } catch (error) {
      console.error("❌ Error al procesar QR:", error);
      setMessage("Error al procesar QR.");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <Text>Solicitando permiso de cámara...</Text>;
  }

  if (!permission.granted) {
    return <Text>No se concedió acceso a la cámara.</Text>;
  }

  return (
    <View style={styles.container}>
      {!scanned && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
      )}

      {/* Estado visual */}
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
  container: {
    flex: 1,
  },
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
