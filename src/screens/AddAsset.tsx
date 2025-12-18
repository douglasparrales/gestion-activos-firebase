import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Modal, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation, useFocusEffect, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { addAsset, getAsset, getAllAssets } from "../api/assets";
import { Asset } from "../types/Asset";

// --- Tipado y Opciones ---
type RootStackParamList = {
  AddAsset: { assetId?: number } | undefined;
  AssetDetail: { assetId: number; edited?: boolean } | undefined;
  AssetList?: undefined;
};
type AddAssetNavProp = StackNavigationProp<RootStackParamList, "AddAsset">;
type AssetKey = keyof Asset;
type ErrorRecord = Record<string, string>;

const CATEGORIES = ["Equipos", "Mobiliario", "Vehículos", "Otros"];
const STATES = ["Activo", "En mantenimiento", "Baja"];
const LOCATIONS = ["Almacén Central", "Oficina A", "Oficina B", "Planta", "Otro"];

const initialState: Asset = {
  id: 0, nombre: "", categoria: "", estado: "", ubicacion: "", descripcion: "", observacion: "",
  fechaAdquisicion: new Date().toISOString().split("T")[0], fechaRegistro: new Date().toISOString(),
  costoInicial: undefined, depreciacionAnual: undefined,
};

// --- Componentes Reutilizables ---
const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);
const SelectField = ({ label, value, error, placeholder, onPress }: { label: string; value: string; error?: string; placeholder: string; onPress: () => void; }) => (
  <Field label={label} error={error}>
    <TouchableOpacity style={[styles.select, error && styles.inputError]} onPress={onPress}>
      <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || placeholder}</Text>
      <Ionicons name="chevron-down" size={18} color="#999" />
    </TouchableOpacity>
  </Field>
);

// --- Componente Principal ---
export default function AddAsset() {
  const route = useRoute<RouteProp<RootStackParamList, "AddAsset">>();
  const navigation = useNavigation<AddAssetNavProp>();
  const { assetId } = route.params || {};

  const [asset, setAsset] = useState<Asset>(initialState);
  const [savedAsset, setSavedAsset] = useState<Asset | null>(null);
  const [errors, setErrors] = useState<ErrorRecord>({});
  const [loading, setLoading] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [showUpdatedMessage, setShowUpdatedMessage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerTitle, setPickerTitle] = useState("");
  const [pickerField, setPickerField] = useState<AssetKey | null>(null);

  // --- Utils ---
  const displayDate = (iso: string) => { const d = new Date(iso); return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`; };
  const capitalizeWords = (s = "") => s.split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")).join(" ");
  const requiredNonEmpty = (v: any) => (v === undefined || v === null || String(v).trim() === "");
  const isValidDecimal = (val: string) => /^\d+(\.\d{1,2})?$/.test(val);

  // --- Validación y Manejo de Cambios ---
  const validateField = useCallback((field: AssetKey, value: any) => {
    let errorMsg = "";
    const val = String(value ?? "").trim();
    const numValue = Number(val);

    switch (field) {
      case "nombre":
        if (requiredNonEmpty(value)) errorMsg = "El nombre es obligatorio.";
        else if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(val)) errorMsg = "Solo letras, sin números.";
        else if (val.length < 3) errorMsg = "Mínimo 3 caracteres."; break;
      case "categoria": if (requiredNonEmpty(value)) errorMsg = "Obligatoria."; else if (!CATEGORIES.includes(value)) errorMsg = "Inválida."; break;
      case "estado": if (requiredNonEmpty(value)) errorMsg = "Obligatorio."; else if (!STATES.includes(value)) errorMsg = "Inválido."; break;
      case "ubicacion": if (requiredNonEmpty(value)) errorMsg = "Obligatoria."; else if (!LOCATIONS.includes(value)) errorMsg = "Inválida."; break;
      case "fechaAdquisicion":
        if (requiredNonEmpty(value)) errorMsg = "Obligatoria.";
        else if (new Date(val) > new Date()) errorMsg = "No puede ser futura."; break;
      case "costoInicial":
        if (requiredNonEmpty(value)) errorMsg = "Obligatorio.";
        else if (val.startsWith("0") && val.length > 1) errorMsg = "No debe iniciar con 0.";
        else if (isNaN(numValue) || numValue <= 0) errorMsg = "Debe ser > 0.";
        else if (!isValidDecimal(val)) errorMsg = "Máx. 2 decimales."; break;
      case "depreciacionAnual":
        if (!requiredNonEmpty(value)) {
          if (isNaN(numValue) || numValue < 0 || numValue > 100) errorMsg = "Debe ser entre 0 y 100.";
          else if (!isValidDecimal(val)) errorMsg = "Máx. 2 decimales.";
        } break;
      case "descripcion": case "observacion": if (val.length > 500) errorMsg = "Máx. 500 caracteres."; break;
    }
    setErrors((p) => ({ ...p, [field]: errorMsg }));
    return errorMsg === "";
  }, []);

  const handleChange = (field: AssetKey, value: any) => {
    let formatted = value;
    if (field === "costoInicial" || field === "depreciacionAnual") formatted = String(value).replace(/[^0-9.]/g, "");
    else if (typeof value === "string") formatted = capitalizeWords(value);
    setAsset((p) => ({ ...p, [field]: formatted }));
    validateField(field, formatted);
  };

  const handleDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) handleChange("fechaAdquisicion", selected.toISOString().split("T")[0]);
  };

  const openPicker = (field: AssetKey, title: string, opts: string[]) => {
    setPickerField(field); setPickerTitle(title); setPickerOptions(opts); setPickerVisible(true);
  };

  const onPickerSelect = (value: string) => {
    if (pickerField) handleChange(pickerField, value);
    setPickerVisible(false);
  };

  const validateForm = () => {
    const fields: AssetKey[] = ["nombre", "categoria", "estado", "ubicacion", "costoInicial", "fechaAdquisicion", "depreciacionAnual", "descripcion", "observacion"];
    return fields.every((f) => validateField(f, (asset as any)[f])) && Object.values(errors).every((e) => !e);
  };

  // --- Efectos de Carga ---
  useEffect(() => { // Carga Inicial
    getAllAssets().then((all) => setTotalAssets(Array.isArray(all) ? all.length : null)).catch(() => setTotalAssets(null));
  }, []);

  useFocusEffect( // Resetear en modo Creación
    useCallback(() => { if (!assetId) { setAsset(initialState); setSavedAsset(null); setErrors({}); } }, [assetId])
  );

  useEffect(() => { // Cargar Activo para Edición
    if (assetId) {
      setLoadingAsset(true);
      getAsset(assetId).then((existing) => {
        if (existing) { setAsset(existing); setSavedAsset(existing); }
      }).finally(() => setLoadingAsset(false));
    }
  }, [assetId]);

  // --- Guardado y Navegación ---
  const showToast = () => {
    setShowUpdatedMessage(true);
    Animated.sequence([Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.delay(1400), Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })]).start(() => setShowUpdatedMessage(false));
  };

  const handleSave = async () => {
  if (!validateForm()) return;
  setLoading(true);
  try {
    const toSave: Asset = {
      ...asset,
      costoInicial: Number(asset.costoInicial) || 0,
      depreciacionAnual: Number(asset.depreciacionAnual) || 0,
      fechaRegistro: assetId ? asset.fechaRegistro : new Date().toISOString(),
    };
    const newId = await addAsset(toSave);
    const saved = { ...toSave, id: newId };
    setSavedAsset(saved);

    // 🔹 Actualizar total de activos localmente
    setTotalAssets((prev) => (prev ?? 0) + 1);

    // 🔹 Mostrar toast de guardado
    showToast();

    // 🔹 Resetear formulario solo si es creación
    if (!assetId) {
      setAsset(initialState);
      setErrors({});
    }
  } catch (error) {
    console.error("Error al guardar activo:", error);
  } finally {
    setLoading(false);
  }
};


  if (loadingAsset) return (<View style={styles.center}><ActivityIndicator size="large" color="#1E88E5" /><Text style={{ marginTop: 10, color: "#444" }}>Cargando activo...</Text></View>);
  const isInvalid = loading || Object.values(errors).some((e) => e);

  return (
    <KeyboardAvoidingView style={styles.fullScreen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* 🔵 HEADER */}
      <View style={styles.header}>
        <Ionicons name="menu" size={26} color="#FFF" />
        <Text style={styles.headerTitle}>{assetId ? "Editar Activo" : "Registrar Activo"}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 🔽 SCROLL CON EL FORMULARIO */}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Total activos */}
        <View style={styles.totalCard}>
          <View><Text style={styles.totalLabel}>Total activos</Text><Text style={styles.totalNumber}>{totalAssets !== null ? totalAssets : "--"}</Text></View>
          <TouchableOpacity style={styles.totalAction} onPress={() => navigation.navigate("AssetList")}>
            <Ionicons name="layers-outline" size={20} color="#1565C0" /><Text style={styles.totalActionText}>Ver lista</Text>
          </TouchableOpacity>
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <Field label="Nombre" error={errors.nombre}><TextInput style={[styles.input, errors.nombre && styles.inputError]} value={asset.nombre} onChangeText={(v) => handleChange("nombre", v)} /></Field>
          <SelectField label="Categoría" value={asset.categoria} error={errors.categoria} placeholder="Seleccionar categoría" onPress={() => openPicker("categoria", "Seleccionar categoría", CATEGORIES)} />
          <SelectField label="Estado" value={asset.estado} error={errors.estado} placeholder="Seleccionar estado" onPress={() => openPicker("estado", "Seleccionar estado", STATES)} />
          <SelectField label="Ubicación" value={asset.ubicacion} error={errors.ubicacion} placeholder="Seleccionar ubicación" onPress={() => openPicker("ubicacion", "Seleccionar ubicación", LOCATIONS)} />

          {/* Fecha de adquisición */}
          <Field label="Fecha de adquisición" error={errors.fechaAdquisicion}>
            <TouchableOpacity style={[styles.select, errors.fechaAdquisicion && styles.inputError]} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.selectText}>{displayDate(asset.fechaAdquisicion)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#999" />
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={new Date(asset.fechaAdquisicion)} mode="date" maximumDate={new Date()} display="default" onChange={handleDateChange} />}
          </Field>

          <Field label="Costo inicial (USD)" error={errors.costoInicial}><TextInput style={[styles.input, errors.costoInicial && styles.inputError]} value={String(asset.costoInicial ?? "")} keyboardType="numeric" onChangeText={(v) => handleChange("costoInicial", v)} /></Field>
          <Field label="Depreciación anual (%) (opcional)" error={errors.depreciacionAnual}><TextInput style={[styles.input, errors.depreciacionAnual && styles.inputError]} value={String(asset.depreciacionAnual ?? "")} keyboardType="numeric" onChangeText={(v) => handleChange("depreciacionAnual", v)} /></Field>
          <Field label="Descripción" error={errors.descripcion}><TextInput style={[styles.input, styles.textArea, errors.descripcion && styles.inputError]} value={asset.descripcion ?? ""} onChangeText={(v) => handleChange("descripcion", v)} multiline /></Field>
          <Field label="Observación" error={errors.observacion}><TextInput style={[styles.input, styles.textArea, errors.observacion && styles.inputError]} value={asset.observacion ?? ""} onChangeText={(v) => handleChange("observacion", v)} multiline /></Field>

          {/* Botón de Guardar */}
          <TouchableOpacity style={[styles.saveButton, isInvalid && styles.disabledButton]} onPress={handleSave} disabled={isInvalid}>
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={styles.saveText}>{loading ? "Guardando..." : assetId ? "Guardar cambios" : "Registrar activo"}</Text>
          </TouchableOpacity>
        </View>

        {/* Toast y ID Box */}
        {showUpdatedMessage && (<Animated.View style={[styles.updateToast, { opacity: fadeAnim }]}><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.updateToastText}>Activo guardado correctamente</Text></Animated.View>)}
        {savedAsset && (<View style={styles.qrBox}><Text style={styles.qrLabel}>Activo guardado — ID: {savedAsset.id}</Text></View>)}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerTitle}</Text>
            <FlatList data={pickerOptions} keyExtractor={(i) => i} renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onPickerSelect(item)}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )} />
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 36, backgroundColor: "#F5F7FA" },
  header: { backgroundColor: "#1E88E5", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 4, marginBottom: 12 },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  totalCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  totalLabel: { color: "#666", fontSize: 13 },
  totalNumber: { color: "#1E88E5", fontSize: 28, fontWeight: "700" },
  totalAction: { flexDirection: "row", alignItems: "center" },
  totalActionText: { color: "#1565C0", marginLeft: 8, fontWeight: "600" },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },

  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { backgroundColor: "#F9FBFF", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E6EEF9", fontSize: 16 },
  inputError: { borderColor: "#E74C3C" },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  fieldError: { color: "#E74C3C", marginTop: 6, fontSize: 13 },

  select: { backgroundColor: "#F9FBFF", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E6EEF9", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { color: "#111", fontSize: 16 },
  selectPlaceholder: { color: "#9AA6B2" },

  saveButton: { backgroundColor: "#1E88E5", paddingVertical: 14, borderRadius: 12, marginTop: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  saveText: { color: "#fff", marginLeft: 8, fontWeight: "700" },
  disabledButton: { opacity: 0.7 },

  updateToast: { marginTop: 12, backgroundColor: "#2E7D32", padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  updateToastText: { color: "#fff", marginLeft: 8, fontWeight: "600" },

  qrBox: { marginTop: 12, backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12, alignItems: "center", elevation: 2 },
  qrLabel: { fontWeight: "600", marginBottom: 8 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  fullScreen: { flex: 1, backgroundColor: "#F5F7FA" },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: "50%" },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F3F6" },
  modalItemText: { fontSize: 16 },
});