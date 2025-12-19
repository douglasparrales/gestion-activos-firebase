import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Modal, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { addAsset, getAsset, getAllAssets } from "../api/assets";
import { getCategories } from "../api/categories";
import { getLocations } from "../api/locations";
import { useUser } from "../context/UserContext";
import { Asset } from "../types/Asset";

const STATES = ["Activo", "En mantenimiento", "Baja"];

const initialState: Asset = {
  id: 0, nombre: "", categoria: "", estado: "", ubicacion: "", descripcion: "", observacion: "",
  fechaAdquisicion: new Date().toISOString().split("T")[0], fechaRegistro: new Date().toISOString(),
  costoInicial: undefined, depreciacionAnual: undefined, 
  cantidad: 1,
};

const InputField = ({ label, value, error, onPress, children, disabled }: any) => (
  <View style={styles.fW}>
    <Text style={styles.fL}>{label}</Text>
    {onPress ? (
      <TouchableOpacity 
        style={[styles.sel, error && styles.iE, disabled && { opacity: 0.6 }]} 
        onPress={onPress} 
        disabled={disabled}
      >
        <Text style={[styles.selT, !value && styles.sP]}>{value || "Seleccionar..."}</Text>
        <Ionicons name={label.includes("Fecha") ? "calendar-outline" : "chevron-down"} size={18} color="#999" />
      </TouchableOpacity>
    ) : children}
    {error ? <Text style={styles.fE}>{error}</Text> : null}
  </View>
);

export default function AddAsset() {
  const route = useRoute<any>(), navigation = useNavigation<any>(), { assetId } = route.params || {};
  const { user } = useUser();
  
  const [asset, setAsset] = useState<Asset>(initialState);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [pick, setPick] = useState({ visible: false, title: "", data: [] as string[], field: "" });
  const [showDP, setShowDP] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isEditing = Boolean(assetId);
  const canEditDate = user?.role === "admin" || !isEditing;

  const validate = (f: keyof Asset, v: any) => {
    let m = ""; const val = String(v ?? "").trim();
    if (["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"].includes(f) && !val) {
      m = "Obligatorio";
    } else if (f === "nombre" && !/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(val)) {
      m = "Solo letras";
    } else if (f === "costoInicial" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser > 0";
    } else if (f === "cantidad" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser mayor a 0";
    }
    setErrors(p => ({ ...p, [f]: m })); return !m;
  };

  const handleChange = (f: keyof Asset, v: any) => {
    let val = ["costoInicial", "depreciacionAnual", "cantidad"].includes(f) 
      ? String(v).replace(/[^0-9.]/g, "") 
      : v;
    if (typeof v === "string" && f === "nombre") {
      val = v.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    setAsset(p => ({ ...p, [f]: val })); validate(f, val);
  };

  useEffect(() => {
    getCategories().then(data => setCategories(data.map((c: any) => c.name)));
    getLocations().then(data => setLocations(data.map((l: any) => l.name)));
    getAllAssets().then(all => setTotalAssets(all.length));
    
    if (assetId) { 
      setLoading(true); 
      getAsset(assetId)
        .then(ex => { if(ex) setAsset({ ...ex, cantidad: ex.cantidad ?? 1 }); })
        .finally(() => setLoading(false)); 
    }
  }, [assetId]);

  useFocusEffect(useCallback(() => { 
    if (!assetId) { setAsset(initialState); setErrors({}); } 
  }, [assetId]));

  const handleSave = async () => {
    const fields: (keyof Asset)[] = ["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"];
    if (!fields.every(f => validate(f, asset[f]))) return;
    setLoading(true);
    try {
      const toSave = { 
        ...asset, 
        cantidad: Number(asset.cantidad) || 1,
        costoInicial: Number(asset.costoInicial), 
        depreciacionAnual: Number(asset.depreciacionAnual) || 0 
      };
      
      const id = await addAsset(toSave);
      
      // Mostrar Toast de éxito
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }), 
        Animated.delay(1200), 
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => {
        // SI ESTAMOS EDITANDO: Volver al detalle del activo específico
        if (isEditing) {
          navigation.navigate("AssetDetail", { assetId: assetId });
        } else {
          // SI ES NUEVO: Limpiar formulario y actualizar contador
          setAsset(initialState);
          setErrors({});
          getAllAssets().then(all => setTotalAssets(all.length));
        }
      });

    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F7FA" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.hT}>{assetId ? "Editar" : "Registrar"} Activo</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.cont} keyboardShouldPersistTaps="handled">
        <View style={styles.tC}>
          <View>
            <Text style={{ color: "#666", fontSize: 13 }}>Total activos</Text>
            <Text style={styles.tN}>{totalAssets ?? "--"}</Text>
          </View>
          {/* BOTÓN "VER LISTA" CORREGIDO */}
          <TouchableOpacity 
            style={styles.r} 
            onPress={() => navigation.navigate("Tabs", { screen: "Activos" })}
          >
            <Ionicons name="layers-outline" size={20} color="#1565C0" />
            <Text style={styles.at}>Ver lista</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <InputField label="Nombre del Activo" error={errors.nombre}>
            <TextInput style={[styles.in, errors.nombre && styles.iE]} value={asset.nombre} onChangeText={v => handleChange("nombre", v)} placeholder="Ej: Laptop Dell" />
          </InputField>

          <InputField label="Cantidad" error={errors.cantidad}>
            <TextInput style={[styles.in, errors.cantidad && styles.iE]} value={String(asset.cantidad)} keyboardType="numeric" onChangeText={v => handleChange("cantidad", v)} placeholder="Ej: 1" />
          </InputField>

          <InputField label="Categoría" value={asset.categoria} error={errors.categoria} onPress={() => setPick({ visible: true, title: "Categoría", data: categories, field: "categoria" })} />
          <InputField label="Estado" value={asset.estado} error={errors.estado} onPress={() => setPick({ visible: true, title: "Estado", data: STATES, field: "estado" })} />
          <InputField label="Ubicación/Bodega" value={asset.ubicacion} error={errors.ubicacion} onPress={() => setPick({ visible: true, title: "Ubicación", data: locations, field: "ubicacion" })} />
          
          <InputField label="Fecha de adquisición" value={asset.fechaAdquisicion} error={errors.fechaAdquisicion} disabled={!canEditDate} onPress={() => setShowDP(true)} />
          
          {showDP && canEditDate && (
            <DateTimePicker 
              value={new Date(asset.fechaAdquisicion)} 
              mode="date" 
              maximumDate={new Date()} 
              onChange={(_, d) => { setShowDP(false); if(d) handleChange("fechaAdquisicion", d.toISOString().split("T")[0]); }} 
            />
          )}

          <InputField label="Costo inicial (USD)" error={errors.costoInicial}>
            <TextInput style={[styles.in, errors.costoInicial && styles.iE]} value={String(asset.costoInicial ?? "")} keyboardType="numeric" onChangeText={v => handleChange("costoInicial", v)} placeholder="0.00" />
          </InputField>

          <InputField label="Descripción">
            <TextInput style={[styles.in, { minHeight: 60 }]} value={asset.descripcion} onChangeText={v => handleChange("descripcion", v)} multiline placeholder="Detalles técnicos..." />
          </InputField>

          <InputField label="Observación">
            <TextInput style={[styles.in, { minHeight: 60 }]} value={asset.observacion} onChangeText={v => handleChange("observacion", v)} multiline placeholder="Notas adicionales..." />
          </InputField>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={styles.btnT}>{loading ? "Guardando..." : "Guardar"}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={{ color: "#fff" }}>¡Guardado con éxito!</Text>
        </Animated.View>
      </ScrollView>

      <Modal visible={pick.visible} transparent animationType="slide">
        <Pressable style={styles.mO} onPress={() => setPick({ ...pick, visible: false })}>
          <View style={styles.mC}>
            <Text style={styles.mT}>{pick.title}</Text>
            <FlatList 
              data={pick.data} 
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.mI} onPress={() => { handleChange(pick.field as any, item); setPick({ ...pick, visible: false }); }}>
                  <Text>{item}</Text>
                </TouchableOpacity>
              )} 
            />
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#1E88E5", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4 },
  backBtn: { padding: 4 },
  hT: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  cont: { padding: 18 },
  tC: { backgroundColor: "#FFF", borderRadius: 14, padding: 14, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 2 },
  tN: { color: "#1E88E5", fontSize: 26, fontWeight: "700" },
  r: { flexDirection: "row", alignItems: "center" },
  at: { color: "#1565C0", marginLeft: 8, fontWeight: "600" },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, elevation: 2 },
  fW: { marginBottom: 12 },
  fL: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 5 },
  in: { backgroundColor: "#F9FBFF", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E6EEF9", color: "#333" },
  sel: { backgroundColor: "#F9FBFF", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E6EEF9", flexDirection: "row", justifyContent: "space-between" },
  selT: { fontSize: 15, color: "#333" },
  sP: { color: "#9AA6B2" }, 
  iE: { borderColor: "#E74C3C" }, 
  fE: { color: "#E74C3C", fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: "#1E88E5", padding: 14, borderRadius: 12, marginTop: 10, flexDirection: "row", justifyContent: "center" },
  btnT: { color: "#fff", marginLeft: 8, fontWeight: "700" },
  toast: { marginTop: 15, backgroundColor: "#2E7D32", padding: 12, borderRadius: 10, alignItems: "center" },
  mO: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  mC: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "40%" },
  mT: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  mI: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#EEE" }
});