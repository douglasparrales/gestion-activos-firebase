import React, { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { addAsset, getAsset } from "../api/assets";
import { Asset } from "../types/Asset";
import { RouteProp, useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// 🔹 Definimos el stack con los tipos correctos
type RootStackParamList = {
  AddAsset: { assetId?: number };
  AssetDetail: { assetId: number; edited?: boolean };
};

// 🔹 Tipamos la navegación correctamente
type AddAssetNavProp = StackNavigationProp<RootStackParamList, "AddAsset">;

export default function AddAsset() {
  const route = useRoute<RouteProp<RootStackParamList, "AddAsset">>();
  const navigation = useNavigation<AddAssetNavProp>();
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

  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showDatePicker, setShowDatePicker] = useState(false);

  const displayDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) return "";
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const showUpdateToast = () => {
    setShowUpdatedMessage(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowUpdatedMessage(false));
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!assetId) {
        setAsset(initialState);
        setSavedAsset(null);
        setMessage("");
        setErrors({});
      }
    }, [assetId])
  );

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

  const capitalizeWords = (text: string) =>
    text
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const handleChange = (field: keyof Asset, value: string) => {
    const formattedValue =
      field === "costoInicial" || field === "depreciacionAnual"
        ? value.replace(/[^0-9.]/g, "")
        : capitalizeWords(value);

    setAsset({ ...asset, [field]: formattedValue });
    validateField(field, formattedValue);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split("T")[0];
      setAsset({ ...asset, fechaAdquisicion: isoDate });
      validateField("fechaAdquisicion", isoDate);
    }
  };

  const validateField = (field: keyof Asset, value: string) => {
    const newErrors = { ...errors };
    switch (field) {
      case "nombre":
        newErrors.nombre = !value.trim() ? "El nombre es obligatorio." : "";
        break;
      case "categoria":
        newErrors.categoria = !value.trim() ? "La categoría es obligatoria." : "";
        break;
      case "estado":
        newErrors.estado = !value.trim() ? "El estado es obligatorio." : "";
        break;
      case "ubicacion":
        newErrors.ubicacion = !value.trim() ? "La ubicación es obligatoria." : "";
        break;
      case "costoInicial":
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors.costoInicial = "Costo inicial inválido (mayor a 0).";
        } else if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          newErrors.costoInicial = "Máximo 2 decimales permitidos.";
        } else newErrors.costoInicial = "";
        break;
      case "depreciacionAnual":
        if (!value || isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100) {
          newErrors.depreciacionAnual = "Depreciación debe estar entre 0% y 100%.";
        } else if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          newErrors.depreciacionAnual = "Máximo 2 decimales permitidos.";
        } else newErrors.depreciacionAnual = "";
        break;
      case "fechaAdquisicion":
        if (new Date(value) > new Date()) {
          newErrors.fechaAdquisicion = "La fecha de adquisición no puede ser futura.";
        } else {
          newErrors.fechaAdquisicion = "";
        }
        break;
    }
    setErrors(newErrors);
  };

  const validate = () => {
    const newErrors: any = {};
    if (!asset.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!asset.categoria.trim()) newErrors.categoria = "La categoría es obligatoria.";
    if (!asset.estado.trim()) newErrors.estado = "El estado es obligatorio.";
    if (!asset.ubicacion.trim()) newErrors.ubicacion = "La ubicación es obligatoria.";

    if (!asset.costoInicial || isNaN(Number(asset.costoInicial)) || Number(asset.costoInicial) <= 0) {
      newErrors.costoInicial = "Costo inicial inválido (debe ser mayor a 0).";
    } else if (!/^\d+(\.\d{1,2})?$/.test(String(asset.costoInicial))) {
      newErrors.costoInicial = "Máximo 2 decimales permitidos.";
    }

    if (
      asset.depreciacionAnual === undefined ||
      isNaN(Number(asset.depreciacionAnual)) ||
      Number(asset.depreciacionAnual) < 0 ||
      Number(asset.depreciacionAnual) > 100
    ) {
      newErrors.depreciacionAnual = "Depreciación debe estar entre 0% y 100%.";
    } else if (!/^\d+(\.\d{1,2})?$/.test(String(asset.depreciacionAnual))) {
      newErrors.depreciacionAnual = "Máximo 2 decimales permitidos.";
    }

    if (new Date(asset.fechaAdquisicion) > new Date()) {
      newErrors.fechaAdquisicion = "La fecha de adquisición no puede ser futura.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasErrors = Object.values(errors).some((err) => err);

  const handleSave = async () => {
    setMessage("");
    if (!validate()) return;

    setLoading(true);
    try {
      const assetToSave: Asset = {
        ...asset,
        nombre: asset.nombre.trim(),
        fechaRegistro: assetId ? asset.fechaRegistro : new Date().toISOString(),
        costoInicial: Number(asset.costoInicial),
        depreciacionAnual: Number(asset.depreciacionAnual),
      };

      const newId = await addAsset(assetToSave);
      const saved = { ...assetToSave, id: newId };
      setSavedAsset(saved);

      if (assetId) {
        // Navegar a detalles con el flag 'edited'
        navigation.navigate("AssetDetail", { assetId: saved.id, edited: true });
      } else {
        // Nuevo activo: quedarse en AddAsset
        setAsset(initialState);
        setMessage("✅ Activo guardado correctamente");
      }
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {savedAsset && (
          <View style={styles.topInfoBox}>
            <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
            <Text style={styles.topInfoText}>Activo guardado con ID: {savedAsset.id}</Text>
          </View>
        )}

        <Text style={styles.title}>{assetId ? "Editar Activo" : "Registrar Activo"}</Text>

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

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateText}>Fecha Adquisición: {displayDate(asset.fechaAdquisicion)}</Text>
        </TouchableOpacity>
        {errors.fechaAdquisicion ? <Text style={styles.errorText}>{errors.fechaAdquisicion}</Text> : null}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(asset.fechaAdquisicion)}
            mode="date"
            maximumDate={new Date()}
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Input
          label="Costo inicial (USD)"
          value={formatNumber(Number(asset.costoInicial))}
          error={errors.costoInicial}
          keyboard="numeric"
          onChange={(v) => handleChange("costoInicial", v)}
        />
        <Input
          label="Depreciación anual (%)"
          value={formatNumber(Number(asset.depreciacionAnual))}
          error={errors.depreciacionAnual}
          keyboard="numeric"
          onChange={(v) => handleChange("depreciacionAnual", v)}
        />

        <TouchableOpacity
          style={[styles.saveButton, hasErrors && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading || hasErrors}
        >
          <Ionicons name="save-outline" size={22} color="white" />
          <Text style={styles.saveText}>{loading ? "Guardando..." : "Guardar Activo"}</Text>
        </TouchableOpacity>

        {showUpdatedMessage && (
          <Animated.View style={[styles.updateToast, { opacity: fadeAnim }]}>
            <Ionicons name="checkmark-circle" size={22} color="white" />
            <Text style={styles.updateToastText}>Activo actualizado correctamente</Text>
          </Animated.View>
        )}

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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, backgroundColor: "#F9FAFB", paddingTop: 40 },
  topInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F5",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#1ABC9C",
  },
  topInfoText: { marginLeft: 10, fontSize: 17, fontWeight: "700", color: "#1ABC9C" },
  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 20 },
  updateToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28C76F",
    padding: 14,
    borderRadius: 14,
    marginTop: 15,
    marginBottom: 10,
    elevation: 3,
  },
  updateToastText: { color: "white", fontSize: 16, fontWeight: "600", marginLeft: 10 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: { backgroundColor: "white", padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: "#DDD" },
  errorText: { color: "#E74C3C", marginTop: 5, fontSize: 13 },
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
  saveText: { color: "white", fontSize: 18, fontWeight: "600", marginLeft: 10 },
  qrBox: { marginTop: 10, alignItems: "center", backgroundColor: "white", padding: 20, borderRadius: 16, elevation: 5 },
  qrLabel: { fontSize: 16, marginBottom: 15, fontWeight: "600" },
  dateButton: { padding: 14, backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#DDD", marginBottom: 6 },
  dateText: { fontSize: 16 },
});
