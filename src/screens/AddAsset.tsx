import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { addAsset, getAsset } from "../api/assets";
import { Asset } from "../types/Asset";
import { RouteProp, useRoute } from "@react-navigation/native";

type RootStackParamList = {
  AddAsset: { assetId?: string };
};

export default function AddAsset() {
  const route = useRoute<RouteProp<RootStackParamList, "AddAsset">>();
  const { assetId } = route.params || {};

  const [asset, setAsset] = useState<Asset>({
    id: "",
    nombre: "",
    categoria: "",
    estado: "",
    ubicacion: "",
    fechaAdquisicion: new Date().toISOString().split("T")[0],
    fechaRegistro: new Date().toISOString(),
  });

  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  // 🔹 Cargar activo si viene assetId
  useEffect(() => {
    const fetchAsset = async () => {
      if (!assetId) return;
      setLoadingAsset(true);
      try {
        const existing = await getAsset(assetId);
        if (existing) {
          setAsset(existing);
          setSavedAsset(existing);
          setMessage(`Activo cargado (ID: ${existing.id})`);
          console.log("✅ Activo cargado:", existing);
        } else {
          setMessage("⚠️ No se encontró el activo especificado.");
        }
      } catch (error) {
        console.error("❌ Error cargando activo:", error);
        setMessage("Error al cargar activo.");
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAsset();
  }, [assetId]);

  // 🔹 Actualizar campos
  const handleChange = (field: keyof Asset, value: string) => {
    setAsset({ ...asset, [field]: value });
  };

  // 🔹 Guardar activo (crea o actualiza)
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const assetToSave: Asset = {
        ...asset,
        fechaRegistro: new Date().toISOString(),
      };

      const newId = await addAsset(assetToSave); // devuelve ID si es nuevo
      const saved = { ...assetToSave, id: newId };

      setSavedAsset(saved);
      setMessage(assetId ? "✅ Activo actualizado correctamente." : "✅ Activo creado correctamente.");

      // Si era nuevo, limpiar los campos
      if (!assetId) {
        setAsset({
          id: "",
          nombre: "",
          categoria: "",
          estado: "",
          ubicacion: "",
          fechaAdquisicion: new Date().toISOString().split("T")[0],
          fechaRegistro: new Date().toISOString(),
        });
      }

      console.log("💾 Guardado exitoso:", saved);
    } catch (error: any) {
      setMessage("❌ Error al guardar: " + error.message);
      console.error("Error guardando activo:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAsset) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando activo...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {assetId ? "Editar Activo" : "Registrar Activo"}
      </Text>

      {/* Campos del formulario */}
      {["nombre", "categoria", "estado", "ubicacion"].map((field) => (
        <TextInput
          key={field}
          placeholder={field}
          style={styles.input}
          value={(asset as any)[field]}
          onChangeText={(v) => handleChange(field as keyof Asset, v)}
        />
      ))}

      <Button
        title={loading ? "Guardando..." : assetId ? "Actualizar" : "Guardar"}
        onPress={handleSave}
        disabled={loading}
      />

      {/* Mensaje de estado */}
      {message !== "" && (
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            color: message.startsWith("✅") ? "green" : "red",
          }}
        >
          {message}
        </Text>
      )}

      {/* QR del activo guardado */}
      {savedAsset && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text>QR del activo (ID: {savedAsset.id})</Text>
          <QRCode value={savedAsset.id} size={200} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    marginBottom: 8,
    padding: 8,
    borderRadius: 5,
  },
  title: { fontSize: 20, marginBottom: 10, fontWeight: "600" },
});
