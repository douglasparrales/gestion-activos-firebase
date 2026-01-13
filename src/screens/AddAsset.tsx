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
  id: 0, 
  nombre: "", 
  categoria: "", 
  estado: "", 
  ubicacion: "", 
  descripcion: "", 
  observacion: "",
  fechaAdquisicion: new Date().toISOString().split("T")[0], 
  fechaRegistro: new Date().toISOString(),
  costoInicial: undefined, 
  depreciacionAnual: undefined, 
  cantidad: 1,
};

const InputField = ({ label, value, error, onPress, children, disabled }: any) => (
  <View style={styles.fW}>
    <Text style={styles.fL}>{label}</Text>
    {onPress ? (
      <TouchableOpacity 
        style={[styles.sel, error && styles.iE, disabled && { opacity: 0.6, backgroundColor: "#F0F0F0" }]} 
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
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { assetId } = route.params || {};
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
  const canEditAdminFields = user?.role === "admin" || !isEditing;

  // EFECTO 1: Carga de catálogos iniciales
  useEffect(() => {
    getCategories().then(data => setCategories(data.map((c: any) => c.name)));
    getLocations().then(data => setLocations(data.map((l: any) => l.name)));
    getAllAssets().then(all => setTotalAssets(all.length));
  }, []);

  // EFECTO 2: Carga de datos si es edición o limpieza si no lo es
  useEffect(() => {
    if (assetId) { 
      setLoading(true); 
      getAsset(assetId)
        .then(ex => { if(ex) setAsset({ ...ex, cantidad: ex.cantidad ?? 1 }); })
        .finally(() => setLoading(false)); 
    } else {
      setAsset(initialState);
      setErrors({});
    }
  }, [assetId]);

  // EFECTO 3: Limpieza de parámetros al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      if (!assetId) {
        setAsset(initialState);
        setErrors({});
      }
      return () => {
        // Limpia el assetId de la ruta al salir para que la próxima vez entre limpio
        navigation.setParams({ assetId: undefined });
      };
    }, [assetId, navigation])
  );

  const validate = (f: keyof Asset, v: any) => {
    let m = ""; const val = String(v ?? "").trim();
    if (["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"].includes(f) && !val) {
      m = "Obligatorio";
    } else if (f === "nombre" && !/^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9 ]+$/.test(val)) {
      m = "Nombre inválido";
    } else if (f === "costoInicial" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser > 0";
    } else if (f === "cantidad" && (isNaN(Number(val)) || Number(val) <= 0)) {
      m = "Debe ser mayor a 0";
    } else if (f === "depreciacionAnual" && val !== "" && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 100)) {
      m = "0 a 100%";
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
    
    setAsset(p => ({ ...p, [f]: val })); 
    validate(f, val);
  };

  const handleSave = async () => {
    const fields: (keyof Asset)[] = ["nombre", "categoria", "estado", "ubicacion", "costoInicial", "cantidad"];
    if (!fields.every(f => validate(f, asset[f]))) return;
    
    if (asset.depreciacionAnual && !validate("depreciacionAnual", asset.depreciacionAnual)) return;

    setLoading(true);
    try {
      const toSave = { 
        ...asset, 
        cantidad: Number(asset.cantidad) || 1,
        costoInicial: Number(asset.costoInicial), 
        depreciacionAnual: asset.depreciacionAnual ? Number(asset.depreciacionAnual) : 0 
      };
      
      await addAsset(toSave);
      
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }), 
        Animated.delay(1200), 
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start(() => {
        if (isEditing) {
          navigation.setParams({ assetId: undefined });
          navigation.navigate("AssetDetail", { assetId: assetId });
        } else {
          setAsset(initialState);
          setErrors({});
          getAllAssets().then(all => setTotalAssets(all.length));
        }
      });

    } catch (e) { 
      console.log(e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F5F7FA" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.hT}>{isEditing ? "Editar" : "Registrar"} Activo</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.cont} keyboardShouldPersistTaps="handled">
        <View style={styles.tC}>
          <View>
            <Text style={{ color: "#666", fontSize: 13 }}>Total activos registrados</Text>
            <Text style={styles.tN}>{totalAssets ?? "--"}</Text>
          </View>
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
          
          <InputField label="Fecha de adquisición" value={asset.fechaAdquisicion} error={errors.fechaAdquisicion} disabled={!canEditAdminFields} onPress={() => setShowDP(true)} />
          
          {showDP && canEditAdminFields && (
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

          <InputField label="Depreciación Anual (%)" error={errors.depreciacionAnual}>
            <TextInput 
              style={[styles.in, errors.depreciacionAnual && styles.iE, !canEditAdminFields && { opacity: 0.6, backgroundColor: "#F0F0F0" }]} 
              value={asset.depreciacionAnual !== undefined ? String(asset.depreciacionAnual) : ""} 
              keyboardType="numeric" 
              editable={canEditAdminFields}
              onChangeText={v => handleChange("depreciacionAnual", v)} 
              placeholder="Ej: 10" 
            />
          </InputField>

          <InputField label="Descripción">
            <TextInput style={[styles.in, { minHeight: 60 }]} value={asset.descripcion} onChangeText={v => handleChange("descripcion", v)} multiline placeholder="Detalles técnicos..." />
          </InputField>

          <InputField label="Observación">
            <TextInput style={[styles.in, { minHeight: 60 }]} value={asset.observacion} onChangeText={v => handleChange("observacion", v)} multiline placeholder="Notas adicionales..." />
          </InputField>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            <Ionicons name={loading ? "refresh-outline" : "save-outline"} size={20} color="#FFF" />
            <Text style={styles.btnT}>{loading ? "Guardando..." : "Guardar Activo"}</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>¡Activo guardado con éxito!</Text>
        </Animated.View>
      </ScrollView>

      <Modal visible={pick.visible} transparent animationType="slide">
        <Pressable style={styles.mO} onPress={() => setPick({ ...pick, visible: false })}>
          <View style={styles.mC}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <Text style={styles.mT}>{pick.title}</Text>
                <TouchableOpacity onPress={() => setPick({ ...pick, visible: false })}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            <FlatList 
              data={pick.data} 
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.mI} onPress={() => { handleChange(pick.field as any, item); setPick({ ...pick, visible: false }); }}>
                  <Text style={{ fontSize: 16, color: "#444" }}>{item}</Text>
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
  tC: { backgroundColor: "#FFF", borderRadius: 14, padding: 14, marginBottom: 14, flexDirection: "row", justifyContent: "flex-start", alignItems: "center", elevation: 2 },
  tN: { color: "#1E88E5", fontSize: 26, fontWeight: "700" },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, elevation: 2, marginBottom: 30 },
  fW: { marginBottom: 12 },
  fL: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 5 },
  in: { backgroundColor: "#F9FBFF", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#E6EEF9", color: "#333", fontSize: 15 },
  sel: { backgroundColor: "#F9FBFF", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E6EEF9", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selT: { fontSize: 15, color: "#333" },
  sP: { color: "#9AA6B2" }, 
  iE: { borderColor: "#E74C3C" }, 
  fE: { color: "#E74C3C", fontSize: 12, marginTop: 4 },
  btn: { backgroundColor: "#1E88E5", padding: 16, borderRadius: 12, marginTop: 20, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  btnT: { color: "#fff", marginLeft: 8, fontWeight: "700", fontSize: 16 },
  toast: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: "#2E7D32", padding: 15, borderRadius: 12, alignItems: "center", elevation: 5 },
  mO: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  mC: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: "50%" },
  mT: { fontSize: 18, fontWeight: "700", color: "#1E88E5" },
  mI: { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }
});