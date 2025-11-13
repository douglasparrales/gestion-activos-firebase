import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";

import { addAsset, getAsset } from "../api/assets";
import { Asset } from "../types/Asset";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";

type RootStackParamList = {
  AddAsset: { assetId?: number };
};

export default function AddAsset() {
  const route = useRoute<RouteProp<RootStackParamList, "AddAsset">>();
  const navigation = useNavigation();
  const { assetId } = route.params || {};

  const initialState: Asset = {
    id: 0,
    nombre: "",
    categoria: "",
    estado: "",
    ubicacion: "",
    fechaAdquisicion: new Date().toISOString().split("T")[0],
    fechaRegistro: new Date().toISOString(),
    costoInicial: undefined,
    depreciacionAnual: undefined,
  };

  const [asset, setAsset] = useState<Asset>(initialState);
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  /* ============================================================
      🔹 Cargar activo si se edita
  ============================================================ */
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
        } else {
          setMessage("⚠️ Activo no encontrado.");
        }
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAsset();
  }, [assetId]);

  /* ============================================================
      🔹 Validaciones profesionales
  ============================================================ */
  const validate = () => {
    const newErrors: any = {};

    if (!asset.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!asset.categoria.trim()) newErrors.categoria = "La categoría es obligatoria.";
    if (!asset.estado.trim()) newErrors.estado = "El estado es obligatorio.";
    if (!asset.ubicacion.trim()) newErrors.ubicacion = "La ubicación es obligatoria.";

    if (!asset.costoInicial || asset.costoInicial <= 0)
      newErrors.costoInicial = "Costo inicial inválido.";

    if (
      asset.depreciacionAnual === undefined ||
      asset.depreciacionAnual < 0 ||
      asset.depreciacionAnual > 100
    )
      newErrors.depreciacionAnual = "Debe estar entre 0% y 100%.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof Asset, value: string) => {
    setAsset({
      ...asset,
      [field]:
        field === "costoInicial" || field === "depreciacionAnual"
          ? Number(value)
          : value,
    });
  };

  /* ============================================================
      🔹 Guardar activo
  ============================================================ */
  const handleSave = async () => {
    setMessage("");

    if (!validate()) return;

    setLoading(true);

    try {
      const assetToSave: Asset = {
        ...asset,
        fechaRegistro: assetId ? asset.fechaRegistro : new Date().toISOString(),
      };

      const newId = await addAsset(assetToSave);

      const saved = { ...assetToSave, id: newId };

      setSavedAsset(saved);
      setAsset(initialState); // limpiar formulario
      setMessage("✅ Activo guardado correctamente");

    } finally {
      setLoading(false);
    }
  };

  if (loadingAsset) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando activo...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {assetId ? "Editar Activo" : "Registrar Activo"}
        </Text>

        {/* Mostrar ID guardado */}
        {savedAsset && (
          <View style={styles.idBoxSaved}>
            <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
            <Text style={styles.idSavedText}>
              Activo guardado con ID: {savedAsset.id}
            </Text>
          </View>
        )}

        {/* Inputs premium */}
        <Input
          label="Nombre"
          value={asset.nombre}
          error={errors.nombre}
          onChange={(v) => handleChange("nombre", v)}
        />

        <Input
          label="Categoría"
          value={asset.categoria}
          error={errors.categoria}
          onChange={(v) => handleChange("categoria", v)}
        />

        <Input
          label="Estado"
          value={asset.estado}
          error={errors.estado}
          onChange={(v) => handleChange("estado", v)}
        />

        <Input
          label="Ubicación"
          value={asset.ubicacion}
          error={errors.ubicacion}
          onChange={(v) => handleChange("ubicacion", v)}
        />

        <Input
          label="Costo inicial (USD)"
          value={asset.costoInicial?.toString() || ""}
          error={errors.costoInicial}
          keyboard="numeric"
          onChange={(v) => handleChange("costoInicial", v)}
        />

        <Input
          label="Depreciación anual (%)"
          value={asset.depreciacionAnual?.toString() || ""}
          keyboard="numeric"
          error={errors.depreciacionAnual}
          onChange={(v) => handleChange("depreciacionAnual", v)}
        />

        {/* Botón premium */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons
            name="save-outline"
            size={22}
            color="white"
          />
          <Text style={styles.saveText}>
            {loading ? "Guardando..." : "Guardar Activo"}
          </Text>
        </TouchableOpacity>

        {/* QR */}
        {savedAsset && (
          <View style={styles.qrBox}>
            <Text style={styles.qrLabel}>QR del activo (ID: {savedAsset.id})</Text>
            <QRCode value={String(savedAsset.id)} size={200} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ============================================================
      🔹 Input Premium con errores
============================================================ */
function Input({
  label,
  value,
  onChange,
  keyboard,
  error,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  keyboard?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, error && { borderColor: "#E74C3C" }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard || "default"}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* ============================================================
      🔹 ESTILOS PREMIUM
============================================================ */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  container: {
    padding: 20,
    backgroundColor: "#F9FAFB",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 20,
  },

  idBoxSaved: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },

  idSavedText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1ABC9C",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  errorText: {
    color: "#E74C3C",
    marginTop: 5,
    fontSize: 13,
  },

  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#007AFF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  saveText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },

  qrBox: {
    marginTop: 30,
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },

  qrLabel: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: "600",
  },
});
