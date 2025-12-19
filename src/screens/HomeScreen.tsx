import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
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

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Tabs"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, setUser } = useUser();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categorias, setCategorias] = useState<Record<string, number>>({});
  const [estados, setEstados] = useState<Record<string, number>>({});
  // 🔧 CAMBIO 1: Estado tipado correctamente
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
      // 🔧 CAMBIO 4: Forzar números para evitar errores de cálculo
      const cantidad = Number(item.cantidad ?? 1);
      const costo = Number(item.costoInicial ?? 0);

      // 💰 Valor total calculado con seguridad
      valor += costo * cantidad;

      // 📦 Categorías
      const cat = item.categoria || "Otros";
      cats[cat] = (cats[cat] || 0) + cantidad;

      // 📊 Estados
      const est = item.estado || "Desconocido";
      sts[est] = (sts[est] || 0) + cantidad;

      // 📍 Ubicaciones
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

  // 🔧 CAMBIO 2: Tipar ubicacionTop para evitar errores de índice
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Configuracion" as never)}
        >
          <Ionicons name="settings-outline" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Activos</Text>
          <Text style={styles.headerUser}>
            {user?.name} ({user?.role})
          </Text>
        </View>

        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView>

        {/* 🔢 TOTAL ACTIVOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total activos</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalNumber}>
              {assets.reduce(
                (sum, a) => sum + Number(a.cantidad ?? 1),
                0
              )}
            </Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("Tabs", { screen: "Agregar" })
              }
            >
              <Ionicons name="add" size={18} color="#1E88E5" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 💰 VALOR TOTAL */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valor total de activos</Text>
          <Text style={styles.money}>
            $
            {totalValor.toLocaleString("es-ES", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* 📊 ESTADOS */}
        <Text style={styles.sectionTitle}>Estados</Text>
        <View style={styles.card}>
          {Object.keys(estados).map((e) => (
            <View key={e} style={styles.row}>
              <Text style={styles.rowText}>{e}</Text>
              <Text style={styles.rowNumber}>{estados[e]}</Text>
            </View>
          ))}
        </View>

        {/* 📍 UBICACIÓN PRINCIPAL */}
        <Text style={styles.sectionTitle}>Ubicación principal</Text>
        <View style={styles.card}>
          {/* 🔧 CAMBIO 3: Renderizado seguro */}
          {ubicacionTop ? (
            <>
              <Text style={styles.rowText}>{ubicacionTop[0]}</Text>
              <Text style={styles.totalNumber}>{ubicacionTop[1]}</Text>
            </>
          ) : (
            <Text style={{ color: "#777" }}>Sin datos</Text>
          )}
        </View>

        {/* 📦 CATEGORÍAS */}
        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.card}>
          {Object.keys(categorias).map((cat) => (
            <View key={cat} style={styles.row}>
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
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" },
  headerUser: { color: "#E3F2FD", fontSize: 12 },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addButtonText: {
    marginLeft: 6,
    color: "#1E88E5",
    fontWeight: "600",
  },
  money: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 6,
  },
  sectionTitle: {
    marginTop: 24,
    marginLeft: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowText: { fontSize: 16 },
  rowNumber: { fontSize: 16, fontWeight: "600", color: "#555" },
});