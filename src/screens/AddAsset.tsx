import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { addAsset } from "../api/assets";
import { Asset } from "../types/Asset";

export default function AddAsset() {
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

  // Función para actualizar campos
  const handleChange = (field: keyof Asset, value: string) => {
    setAsset({ ...asset, [field]: value });
  };

  // Función para guardar activo
  const handleSave = async () => {
    console.log("LOG  Botón guardar presionado");
    console.log("LOG  Guardando activo:", asset);

    if (!asset.id) {
      setMessage("❌ El ID del activo es obligatorio.");
      return;
    }

    try {
      const assetToSave: Asset = {
        ...asset,
        fechaRegistro: new Date().toISOString(),
      };

      await addAsset(assetToSave);

      setSavedAsset(assetToSave);
      setMessage("✅ Activo guardado correctamente.");

      // Limpiar formulario
      setAsset({
        id: "",
        nombre: "",
        categoria: "",
        estado: "",
        ubicacion: "",
        fechaAdquisicion: new Date().toISOString().split("T")[0],
        fechaRegistro: new Date().toISOString(),
      });

      console.log("LOG  Guardado exitoso en Firestore");
    } catch (error: any) {
      setMessage("❌ Error al guardar: " + error.message);
      console.error("Error guardando activo:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar Activo</Text>

      {["id", "nombre", "categoria", "estado", "ubicacion"].map((field) => (
        <TextInput
          key={field}
          placeholder={field}
          style={styles.input}
          value={(asset as any)[field]}
          onChangeText={(v) => handleChange(field as keyof Asset, v)}
        />
      ))}

      <Button title="Guardar" onPress={handleSave} />

      {/* Mensaje */}
      {message !== "" && (
        <Text style={{ marginTop: 10, fontSize: 16, color: savedAsset ? "green" : "red" }}>
          {message}
        </Text>
      )}

      {/* QR del activo guardado */}
      {savedAsset && (
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text>QR del activo:</Text>
          <QRCode value={savedAsset.id} size={200} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, marginBottom: 8, padding: 8, borderRadius: 5 },
  title: { fontSize: 20, marginBottom: 10 },
});
