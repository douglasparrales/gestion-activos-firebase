import React from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Modal, FlatList, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAddAsset, STATES } from "../hooks/useAddAsset";
// Importamos tus estilos globales y colores
import { COLORS } from '../styles/theme'; 
import { globalStyles } from '../styles/globalStyles';

const InputField = ({ label, value, error, onPress, children, disabled }: any) => (
  <View style={globalStyles.inputGroup}>
    <Text style={styles.fL}>{label}</Text>
    {onPress ? (
      <TouchableOpacity 
        activeOpacity={0.6}
        style={[
            styles.sel, 
            error && styles.iE, 
            disabled && { opacity: 0.6, backgroundColor: COLORS.background }
        ]} 
        onPress={onPress} 
        disabled={disabled}
      >
        <Text style={[styles.selT, !value && styles.sP]}>{value || "Seleccionar..."}</Text>
        <Ionicons 
            name={label.includes("Fecha") ? "calendar" : "chevron-down"} 
            size={18} 
            color={COLORS.textMuted} 
        />
      </TouchableOpacity>
    ) : children}
    {error ? <Text style={styles.fE}>{error}</Text> : null}
  </View>
);

export default function AddAsset() {
  const {
    asset, categories, locations, errors, loading, totalAssets,
    pick, setPick, showDP, setShowDP, fadeAnim, isEditing, canEditAdminFields,
    handleChange, handleSave, navigation, assetId
  } = useAddAsset();

  return (
    <KeyboardAvoidingView 
        style={globalStyles.screen} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* HEADER AJUSTADO AL TEMA */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.hT}>{assetId ? "EDITAR" : "NUEVO"} ACTIVO</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.cont} 
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* INDICADOR DE TOTAL USANDO SURFACE Y PRIMARY */}
        <View style={[globalStyles.card, globalStyles.rowBetween, { marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.iconCircle}>
              <Ionicons name="stats-chart" size={20} color={COLORS.accent} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.tLabel}>Activos en sistema</Text>
              <Text style={styles.tN}>{totalAssets ?? "--"}</Text>
            </View>
          </View>
        </View>

        <View style={globalStyles.card}>
          <InputField label="Nombre del Activo" error={errors.nombre}>
            <TextInput 
                style={[styles.in, errors.nombre && styles.iE]} 
                value={asset.nombre} 
                onChangeText={v => handleChange("nombre", v)} 
                placeholder="Ej: Laptop Dell XPS" 
                placeholderTextColor={COLORS.textMuted}
            />
          </InputField>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
                <InputField label="Cantidad" error={errors.cantidad}>
                    <TextInput 
                        style={[styles.in, errors.cantidad && styles.iE]} 
                        value={String(asset.cantidad)} 
                        keyboardType="numeric" 
                        onChangeText={v => handleChange("cantidad", v)} 
                    />
                </InputField>
            </View>
            <View style={{ flex: 1.5 }}>
                <InputField label="Costo (USD)" error={errors.costoInicial}>
                    <TextInput 
                        style={[styles.in, errors.costoInicial && styles.iE]} 
                        value={String(asset.costoInicial ?? "")} 
                        keyboardType="numeric" 
                        onChangeText={v => handleChange("costoInicial", v)} 
                        placeholder="0.00" 
                    />
                </InputField>
            </View>
          </View>

          <InputField label="Categoría" value={asset.categoria} error={errors.categoria} onPress={() => setPick({ visible: true, title: "Seleccionar Categoría", data: categories, field: "categoria" })} />
          <InputField label="Estado Actual" value={asset.estado} error={errors.estado} onPress={() => setPick({ visible: true, title: "Seleccionar Estado", data: STATES, field: "estado" })} />
          <InputField label="Ubicación" value={asset.ubicacion} error={errors.ubicacion} onPress={() => setPick({ visible: true, title: "Seleccionar Ubicación", data: locations, field: "ubicacion" })} />
          
          <InputField label="Fecha de Adquisición" value={asset.fechaAdquisicion} error={errors.fechaAdquisicion} disabled={!canEditAdminFields} onPress={() => setShowDP(true)} />
          
          {showDP && canEditAdminFields && (
            <DateTimePicker 
              value={new Date(asset.fechaAdquisicion)} 
              mode="date" 
              maximumDate={new Date()} 
              onChange={(_, d) => { setShowDP(false); if(d) handleChange("fechaAdquisicion", d.toISOString().split("T")[0]); }} 
            />
          )}

          <InputField label="Depreciación Anual (%)" error={errors.depreciacionAnual}>
            <TextInput 
              style={[styles.in, errors.depreciacionAnual && styles.iE, !canEditAdminFields && { backgroundColor: COLORS.background, color: COLORS.textMuted }]} 
              value={asset.depreciacionAnual !== undefined ? String(asset.depreciacionAnual) : ""} 
              keyboardType="numeric" 
              editable={canEditAdminFields}
              onChangeText={v => handleChange("depreciacionAnual", v)} 
              placeholder="Ej: 10" 
            />
          </InputField>

          <InputField label="Descripción">
            <TextInput 
                style={[styles.in, styles.textArea]} 
                value={asset.descripcion} 
                onChangeText={v => handleChange("descripcion", v)} 
                multiline 
                placeholder="Especificaciones técnicas..." 
            />
          </InputField>

          <InputField label="Observaciones">
            <TextInput 
                style={[styles.in, styles.textArea]} 
                value={asset.observacion} 
                onChangeText={v => handleChange("observacion", v)} 
                multiline 
                placeholder="Notas sobre el estado actual..." 
            />
          </InputField>

          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.btn, loading && { opacity: 0.6 }]} 
            onPress={handleSave} 
            disabled={loading}
          >
            {loading ? (
                <Text style={styles.btnT}>Procesando...</Text>
            ) : (
                <>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                    <Text style={styles.btnT}>{assetId ? "Actualizar Activo" : "Guardar Activo"}</Text>
                </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Animated.View 
        pointerEvents="none" 
        style={[styles.toast, { opacity: fadeAnim }]}
      >
        <Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} />
        <Text style={styles.toastText}>¡Guardado con éxito!</Text>
      </Animated.View>

      <Modal visible={pick.visible} transparent animationType="fade">
        <Pressable style={styles.mO} onPress={() => setPick({ ...pick, visible: false })}>
          <View style={styles.mC}>
            <View style={styles.mBar} />
            <Text style={styles.mT}>{pick.title}</Text>
            <FlatList 
              data={pick.data} 
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.mI} 
                    onPress={() => { handleChange(pick.field as any, item); setPick({ ...pick, visible: false }); }}
                >
                  <Text style={styles.mIText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
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
  header: { 
    backgroundColor: COLORS.secondary, // Cambiado a casi negro/azul pizarra oscuro
    paddingTop: Platform.OS === 'ios' ? 60 : 50, 
    paddingBottom: 25, 
    paddingHorizontal: 20, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  hT: { color: COLORS.white, fontSize: 18, fontWeight: "700" },
  cont: { padding: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  tLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600", textTransform: 'uppercase' },
  tN: { color: COLORS.primary, fontSize: 24, fontWeight: "800" },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  fL: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6, marginLeft: 4 },
  in: { 
    backgroundColor: COLORS.inputBg, 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    color: COLORS.textPrimary,
    fontSize: 15
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  sel: { 
    backgroundColor: COLORS.inputBg, 
    paddingHorizontal: 15, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: 'center'
  },
  selT: { fontSize: 15, color: COLORS.textPrimary },
  sP: { color: COLORS.textMuted }, 
  iE: { borderColor: COLORS.error, backgroundColor: '#FEF2F2' }, 
  fE: { color: COLORS.error, fontSize: 11, marginTop: 5, fontWeight: '500', marginLeft: 4 },
  btn: { 
    backgroundColor: COLORS.primary, // Botón con el color azul brillante de interacción
    paddingVertical: 16, 
    borderRadius: 12, 
    marginTop: 15, 
    flexDirection: "row", 
    justifyContent: "center",
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  btnT: { color: COLORS.white, marginLeft: 10, fontWeight: "700", fontSize: 16 },
  toast: { 
    position: 'absolute', 
    bottom: 40, 
    left: 20, 
    right: 20, 
    backgroundColor: COLORS.success, 
    paddingVertical: 14, 
    borderRadius: 12, 
    flexDirection: 'row',
    alignItems: "center", 
    justifyContent: 'center',
    elevation: 10, 
  },
  toastText: { color: COLORS.white, fontWeight: '600', marginLeft: 8 },
  mO: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.4)" },
  mC: { 
    backgroundColor: COLORS.white, 
    padding: 24, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: "50%" 
  },
  mBar: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  mT: { fontSize: 17, fontWeight: "700", marginBottom: 20, color: COLORS.textPrimary, textAlign: 'center' },
  mI: { 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  mIText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' }
});