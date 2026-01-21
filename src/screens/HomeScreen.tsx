import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, ScrollView, Alert, StatusBar, Dimensions, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "../services/firebaseConfig";
import { signOut } from "firebase/auth";

import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";

import { getAllAssets } from "../services/activosService";
import { RootStackParamList } from "../types/navigation";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");

interface DashboardStats {
  totalValor: number;
  totalActivos: number;
  cats: Record<string, number>;
  sts: Record<string, number>;
  locs: Record<string, number>;
  locsValue: Record<string, number>;
  lastAction?: { user: string; action: string; date: string; };
}

type HomeScreenNavProp = StackNavigationProp<RootStackParamList, "Tabs">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavProp>();
  const { user, setUser } = useUser();
  const [data, setData] = useState<DashboardStats>({
    totalValor: 0, totalActivos: 0, cats: {}, sts: {}, locs: {}, locsValue: {},
  });

  const loadData = async () => {
    const assets = await getAllAssets();
    const stats = assets.reduce((acc: DashboardStats, item) => {
      const qty = Number(item.cantidad ?? 1);
      const cost = Number(item.costoInicial ?? 0);
      const value = qty * cost;
      acc.totalActivos += qty;
      acc.totalValor += value;
      const c = item.categoria || "Otros";
      const e = item.estado || "Desconocido";
      const l = item.ubicacion || "Sin ubicación";
      acc.cats[c] = (acc.cats[c] || 0) + qty;
      acc.sts[e] = (acc.sts[e] || 0) + qty;
      acc.locs[l] = (acc.locs[l] || 0) + qty;
      acc.locsValue[l] = (acc.locsValue[l] || 0) + value;
      return acc;
    }, { totalValor: 0, totalActivos: 0, cats: {}, sts: {}, locs: {}, locsValue: {} });

    try {
      const lastLogSnap = await getDocs(query(collection(db, "logs"), orderBy("createdAt", "desc"), limit(1)));
      if (!lastLogSnap.empty) {
        const log = lastLogSnap.docs[0].data();
        stats.lastAction = {
          user: log.userName || "Admin",
          action: log.action || "Modificación",
          date: log.createdAt?.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || "",
        };
      }
    } catch (e) { console.log(e); }
    setData(stats);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Está seguro?", [
      { text: "No", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: async () => { await signOut(auth); setUser(null); } }
    ]);
  };

  const topCategory = Object.entries(data.cats).sort((a, b) => b[1] - a[1])[0];
  const topLocation = Object.entries(data.locs).sort((a, b) => b[1] - a[1])[0];
  const topLocVal = Object.entries(data.locsValue).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={globalStyles.screen}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={[globalStyles.rowBetween, { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 }]}>
        <View>
          <AppText bold size={11} color={COLORS.textMuted}>BIENVENIDO AL SISTEMA DE ACTIVOS</AppText>
          <AppText bold size={22} color={COLORS.primary}>{user?.name || "Administrador"}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Configuracion" as never)}>
            <Ionicons name="person-circle-outline" size={34} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* TARJETA PRINCIPAL (CAPITAL) */}
        <View style={styles.mainCard}>
          <AppText bold size={10} color="rgba(255,255,255,0.5)">VALOR TOTAL DEL PATRIMONIO</AppText>
          <AppText bold size={36} color={COLORS.white}>${data.totalValor.toLocaleString("es-ES")}</AppText>
          <View style={styles.cardInfoRow}>
            <StatBox label="ACTIVOS" val={data.totalActivos} />
            <StatBox label="UBICACIONES" val={Object.keys(data.locs).length} />
            <StatBox label="CATEGORIAS" val={Object.keys(data.cats).length} />
          </View>
        </View>

        {/* ÚLTIMA ACTIVIDAD MEJORADA */}
        {data.lastAction && (
          <View style={[globalStyles.card, styles.logCard]}>
            <View style={styles.logIndicator} />
            <View style={{ flex: 1 }}>
              <View style={globalStyles.rowBetween}>
                <AppText bold size={12} color={COLORS.textPrimary}>Último movimiento</AppText>
                <AppText size={10} color={COLORS.textMuted}>{data.lastAction.date}</AppText>
              </View>
              <AppText size={13} color={COLORS.textSecondary} style={{ marginTop: 2 }}>
                <AppText bold color={COLORS.accent}>{data.lastAction.user}</AppText> — {data.lastAction.action}
              </AppText>
            </View>
          </View>
        )}

        {/* RESUMEN INTELIGENTE REDISEÑADO */}
        <AppText bold style={styles.sectionTitle}>Análisis de Distribución</AppText>
        <View style={[globalStyles.card, { marginHorizontal: 20, paddingVertical: 10 }]}>
          <View style={styles.gridRow}>
            <GridItem icon="cube" label="Mayor Categoría" value={topCategory?.[0]} sub={`${topCategory?.[1]} unidades`} />
            <GridItem icon="location" label="Ubicacion con más Activos" value={topLocation?.[0]} sub={`${topLocation?.[1]} activos`} />
          </View>
          <View style={[styles.divider, { marginVertical: 10 }]} />
          <View style={styles.gridRow}>
            <GridItem icon="trending-up" label="Mayor Inversión" value={topLocVal?.[0]} sub={`$${topLocVal?.[1].toLocaleString()}`} isCurrency />
            <GridItem icon="list" label="Diversificación" value={`${Object.keys(data.cats).length} Categorías`} sub="Registradas" />
          </View>
        </View>

        {/* ESTADOS DE CONSERVACIÓN */}
        <AppText bold style={styles.sectionTitle}>Estado de Conservación</AppText>
        <View style={styles.statusGrid}>
          {Object.entries(data.sts).map(([key, val]) => (
            <View key={key} style={[globalStyles.card, { width: (width - 52) / 2, marginBottom: 12, padding: 15 }]}>
              <AppText bold size={24} color={COLORS.primary}>{val}</AppText>
              <AppText color={COLORS.textSecondary} size={12} numberOfLines={1}>{key}</AppText>
              <View style={[styles.indicatorBar, { 
                backgroundColor: key.toLowerCase().includes('excelente') || key.toLowerCase().includes('activo') ? COLORS.success : COLORS.accent 
              }]} />
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// --- SUB-COMPONENTES ---

const StatBox = ({ label, val }: { label: string; val: number }) => (
  <View>
    <AppText bold size={9} color="rgba(255,255,255,0.4)">{label}</AppText>
    <AppText bold size={18} color={COLORS.white}>{val}</AppText>
  </View>
);

const GridItem = ({ icon, label, value, sub, isCurrency }: any) => (
  <View style={{ flex: 1, padding: 5 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Ionicons name={icon} size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
      <AppText size={11} color={COLORS.textMuted}>{label}</AppText>
    </View>
    <AppText bold size={14} color={COLORS.primary} numberOfLines={1}>{value || "—"}</AppText>
    <AppText size={10} color={isCurrency ? COLORS.success : COLORS.textSecondary}>{sub}</AppText>
  </View>
);

const styles = StyleSheet.create({
  headerBtn: { 
    padding: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface 
  },
  mainCard: { 
    marginHorizontal: 20, backgroundColor: COLORS.primary, borderRadius: 24, padding: 25, 
    elevation: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  cardInfoRow: { 
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, 
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 
  },
  logCard: {
    marginHorizontal: 20, marginTop: 20, flexDirection: 'row', padding: 12, alignItems: 'center',
  },
  logIndicator: {
    width: 4, height: '100%', backgroundColor: COLORS.accent, borderRadius: 2, marginRight: 12,
  },
  sectionTitle: { 
    fontSize: 15, color: COLORS.textPrimary, marginLeft: 24, marginTop: 25, marginBottom: 12, letterSpacing: 0.5
  },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: COLORS.border, width: '100%' },
  statusGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, justifyContent: 'space-between' 
  },
  indicatorBar: { 
    height: 3, width: 30, borderRadius: 2, marginTop: 12 
  },
});