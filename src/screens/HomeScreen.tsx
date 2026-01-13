import React, { useState, useCallback } from "react";
// REVISA ESTA LÍNEA: Asegúrate de que StyleSheet venga de "react-native"
import { View, TouchableOpacity, ScrollView, Alert, StatusBar, Dimensions, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// 1. IMPORTAMOS NUESTROS NUEVOS ESTILOS GLOBALES
import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";

import { getAllAssets } from "../services/activosService";
import { RootStackParamList } from "../types/navigation";
import { useUser } from "../context/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

const { width } = Dimensions.get("window");

// --- INTERFACES ---
interface DashboardStats {
  totalValor: number;
  totalActivos: number;
  cats: Record<string, number>;
  sts: Record<string, number>;
  locs: Record<string, number>;
}

type HomeScreenNavProp = StackNavigationProp<RootStackParamList, "Tabs">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavProp>();
  const { user, setUser } = useUser();
  const [data, setData] = useState<DashboardStats>({ 
    totalValor: 0, totalActivos: 0, cats: {}, sts: {}, locs: {} 
  });

  const loadData = async () => {
    const assets = await getAllAssets();
    const stats = assets.reduce((acc: DashboardStats, item) => {
      const qty = Number(item.cantidad ?? 1);
      const costo = Number(item.costoInicial ?? 0);
      acc.totalValor += costo * qty;
      acc.totalActivos += qty;
      const c = item.categoria || "Otros";
      const e = item.estado || "Desconocido";
      const l = item.ubicacion || "Sin ubicación";
      acc.cats[c] = (acc.cats[c] || 0) + qty;
      acc.sts[e] = (acc.sts[e] || 0) + qty;
      acc.locs[l] = (acc.locs[l] || 0) + qty;
      return acc;
    }, { totalValor: 0, totalActivos: 0, cats: {}, sts: {}, locs: {} });
    setData(stats);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleLogout = () => {
    Alert.alert("Finalizar Sesión", "¿Está seguro que desea cerrar el sistema?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar Sesión", style: "destructive", onPress: async () => { await signOut(auth); setUser(null); } }
    ]);
  };

  const topLoc = Object.entries(data.locs).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={globalStyles.screen}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER PROFESIONAL */}
      <View style={[globalStyles.rowBetween, { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 }]}>
        <View>
          <AppText bold size={11} color={COLORS.textSecondary}>BIENVENIDO</AppText>
          <AppText bold size={22}>{user?.name || "Administrador"}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* BOTÓN DE LOGOUT MEJORADO */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Configuracion" as never)}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* TARJETA DE PATRIMONIO */}
        <View style={styles.mainCard}>
          <AppText bold size={10} color="rgba(255,255,255,0.4)">CAPITAL TOTAL INVERTIDO</AppText>
          <AppText bold size={34} color={COLORS.white}>${data.totalValor.toLocaleString("es-ES")}</AppText>
          <View style={styles.cardInfoRow}>
            <StatBox label="ACTIVOS" val={data.totalActivos} />
            <StatBox label="CATEGORÍAS" val={Object.keys(data.cats).length} />
            <StatBox label="UBICACIONES" val={Object.keys(data.locs).length} />
          </View>
        </View>

        {/* ESTADOS */}
        <AppText bold style={styles.sectionTitle}>Estado de Conservación</AppText>
        <View style={styles.statusGrid}>
          {Object.entries(data.sts).map(([key, val]) => (
            <View key={key} style={[globalStyles.card, { width: (width - 52) / 2, marginBottom: 12 }]}>
              <AppText bold size={24}>{val}</AppText>
              <AppText color={COLORS.textSecondary} size={12}>{key}</AppText>
              <View style={[styles.indicator, { backgroundColor: key.toLowerCase().includes('excelente') || key.toLowerCase().includes('activo') ? COLORS.secondary : '#F59E0B' }]} />
            </View>
          ))}
        </View>

        {/* CATEGORÍAS */}
        <AppText bold style={styles.sectionTitle}>Distribución por Categoría</AppText>
        <View style={[globalStyles.card, { marginHorizontal: 20 }]}>
          {Object.entries(data.cats).map(([cat, count]) => (
            <View key={cat} style={{ marginBottom: 20 }}>
              <View style={globalStyles.rowBetween}>
                <AppText bold>{cat}</AppText>
                <AppText bold color={COLORS.secondary}>{count} activos</AppText>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(count / (data.totalActivos || 1)) * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* SEDE PRINCIPAL */}
        <AppText bold style={styles.sectionTitle}>Sede Principal</AppText>
        <View style={[globalStyles.card, { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center' }]}>
          <View style={styles.locIcon}><Ionicons name="business-sharp" size={22} color={COLORS.secondary} /></View>
          <View>
            <AppText bold size={16}>{topLoc ? topLoc[0] : "Sin registros"}</AppText>
            <AppText size={13} color={COLORS.textSecondary}>{topLoc ? `${topLoc[1]} activos registrados` : "No hay datos"}</AppText>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const StatBox = ({ label, val }: { label: string; val: number }) => (
  <View>
    <AppText bold size={9} color="rgba(255,255,255,0.35)">{label}</AppText>
    <AppText bold size={17} color={COLORS.white}>{val}</AppText>
  </View>
);

// ESTO DEBE FUNCIONAR SI StyleSheet VIENE DE "react-native"
const styles = StyleSheet.create({
  logoutBtn: { 
    padding: 8, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    backgroundColor: COLORS.surface 
  },
  mainCard: { 
    marginHorizontal: 20, 
    backgroundColor: COLORS.primary, 
    borderRadius: 24, 
    padding: 24, 
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardInfoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)', 
    paddingTop: 18 
  },
  sectionTitle: { 
    fontSize: 16, 
    color: COLORS.textPrimary, 
    marginLeft: 24, 
    marginTop: 28, 
    marginBottom: 14 
  },
  statusGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 18, 
    justifyContent: 'space-between' 
  },
  indicator: { 
    height: 4, 
    width: 28, 
    borderRadius: 2, 
    marginTop: 14 
  },
  progressContainer: { 
    height: 7, 
    backgroundColor: COLORS.background, 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginTop: 8 
  },
  progressBar: { 
    height: '100%', 
    backgroundColor: COLORS.secondary 
  },
  locIcon: { 
    width: 46, 
    height: 46, 
    backgroundColor: '#EFF6FF', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
});