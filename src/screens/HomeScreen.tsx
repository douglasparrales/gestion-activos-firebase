import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { getAllAssets } from "../services/activosService";
import { Asset } from "../types/Asset";
import { RootStackParamList } from "../types/navigation";

import { useUser } from "../context/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Tabs">;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, setUser } = useUser();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categorias, setCategorias] = useState<Record<string, number>>({});
  const [estados, setEstados] = useState<Record<string, number>>({});
  const [ubicaciones, setUbicaciones] = useState<Record<string, number>>({});
  const [totalValor, setTotalValor] = useState(0);

  const loadData = async () => {
    const data = await getAllAssets();
    setAssets(data);

    const cats: Record<string, number> = {};
    const sts: Record<string, number> = {};
    const locs: Record<string, number> = {};
    let valor = 0;

    data.forEach((item) => {
      const cantidad = Number(item.cantidad ?? 1);
      const costo = Number(item.costoInicial ?? 0);
      valor += costo * cantidad;

      const cat = item.categoria || "Otros";
      cats[cat] = (cats[cat] || 0) + cantidad;

      const est = item.estado || "Desconocido";
      sts[est] = (sts[est] || 0) + cantidad;

      const loc = item.ubicacion || "Sin ubicación";
      locs[loc] = (locs[loc] || 0) + cantidad;
    });

    setCategorias(cats);
    setEstados(sts);
    setUbicaciones(locs);
    setTotalValor(valor);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const ubicacionTop = Object.entries(ubicaciones).sort(
    (a, b) => b[1] - a[1]
  )[0] as [string, number] | undefined;

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          setUser(null);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 🔵 HEADER REDISEÑADO */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => navigation.navigate("Configuracion" as never)}
        >
          <Ionicons name="settings-sharp" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Panel de Control</Text>
          <View style={styles.userBadge}>
            <Text style={styles.headerUser}>{user?.name} • {user?.role}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerIconButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* 🔢 SECCIÓN RESUMEN FINANCIERO / CANTIDAD */}
        <View style={styles.summaryRow}>
            <View style={[styles.miniCard, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cube" size={24} color="#1E88E5" />
                <Text style={styles.miniCardValue}>
                    {assets.reduce((sum, a) => sum + Number(a.cantidad ?? 1), 0)}
                </Text>
                <Text style={styles.miniCardLabel}>Activos totales</Text>
            </View>

            <View style={[styles.miniCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="cash" size={24} color="#2E7D32" />
                <Text style={[styles.miniCardValue, { color: '#2E7D32' }]}>
                    ${totalValor.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.miniCardLabel}>Valor estimado</Text>
            </View>
        </View>

        <TouchableOpacity 
            style={styles.addActionButton}
            onPress={() => navigation.navigate("Tabs", { screen: "Agregar" })}
        >
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={styles.addActionButtonText}>Registrar Nuevo Activo</Text>
        </TouchableOpacity>

        {/* 📊 DISTRIBUCIÓN POR ESTADOS */}
        <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart-outline" size={20} color="#475569" />
            <Text style={styles.sectionTitle}>Estados de Conservación</Text>
        </View>
        <View style={styles.card}>
          {Object.keys(estados).map((e) => (
            <View key={e} style={styles.row}>
              <Text style={styles.rowText}>{e}</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{estados[e]}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 📍 UBICACIÓN PRINCIPAL */}
        <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#475569" />
            <Text style={styles.sectionTitle}>Ubicación Principal</Text>
        </View>
        <View style={[styles.card, styles.topLocCard]}>
          {ubicacionTop ? (
            <View style={styles.topLocContent}>
              <Text style={styles.topLocName}>{ubicacionTop[0]}</Text>
              <Text style={styles.topLocDesc}>{ubicacionTop[1]} activos en este lugar</Text>
            </View>
          ) : (
            <Text style={{ color: "#94A3B8" }}>No hay datos disponibles</Text>
          )}
        </View>

        {/* 📦 CATEGORÍAS */}
        <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color="#475569" />
            <Text style={styles.sectionTitle}>Distribución por Categorías</Text>
        </View>
        <View style={styles.card}>
          {Object.keys(categorias).map((cat, index) => (
            <View key={cat} style={[styles.row, index === 0 ? { borderTopWidth: 0 } : null]}>
              <Text style={styles.rowText}>{cat}</Text>
              <Text style={styles.rowNumber}>{categorias[cat]}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  
  // Header
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  userBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 5 },
  headerUser: { color: "#FFF", fontSize: 11, fontWeight: '600' },
  headerIconButton: { padding: 8 },

  // Summary Row
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 12 },
  miniCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  miniCardValue: { fontSize: 20, fontWeight: '800', color: '#1E88E5', marginTop: 8 },
  miniCardLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },

  // Botón Agregar
  addActionButton: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#1E88E5',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, elevation: 3
  },
  addActionButtonText: { color: '#FFF', fontWeight: '700', marginLeft: 8, fontSize: 15 },

  // Secciones
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 25, marginLeft: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#475569", marginLeft: 8 },

  card: {
    marginHorizontal: 16,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  rowText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  rowNumber: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  
  badgeCount: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeCountText: { fontSize: 13, fontWeight: '700', color: '#475569' },

  // Ubicación Top
  topLocCard: { paddingVertical: 20, backgroundColor: '#FFF', borderLeftWidth: 5, borderLeftColor: '#1E88E5' },
  topLocContent: { justifyContent: 'center' },
  topLocName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  topLocDesc: { fontSize: 13, color: '#64748B', marginTop: 2 }
});