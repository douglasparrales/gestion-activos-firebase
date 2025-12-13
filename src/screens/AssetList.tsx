import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAllAssets } from "../api/assets";
import { Ionicons } from "@expo/vector-icons";

// Exportar Excel
import { exportAssetsToExcel } from "../utils/exportExcel";

type NavProp = StackNavigationProp<RootStackParamList, "AssetList">;

export default function AssetList() {
  const navigation = useNavigation<NavProp>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    setLoading(true);
    const data = await getAllAssets();
    setAssets(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={{ marginTop: 10, color: "#444" }}>Cargando activos...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.card}
      // Navegación: item.id debe ser un número para la ruta, lo que es correcto aquí.
      onPress={() => navigation.navigate("AssetDetail", { assetId: item.id })}
    >
      <View style={styles.cardContent}>
        {/* ✅ REFUERZO: Aseguramos que el nombre es string */}
        <Text style={styles.cardTitle}>{String(item.nombre)}</Text>

        {/* Renderizado Condicional Reforzado: Aseguramos que es un String si existe */}
        {item.categoria && <Text style={styles.cardSubtitle}>{String(item.categoria)}</Text>}

        {/* Renderizado Condicional Reforzado: Aseguramos que es un String si existe */}
        {item.estado && <Text style={styles.status}>Estado: {String(item.estado)}</Text>}

        {/* 🚨 CORRECCIÓN CLAVE: item.id puede ser un número, lo casteamos a string dentro del Text */}
        <Text style={styles.cardId}>ID: {String(item.id)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={26} color="#A0A0A0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* 🔵 HEADER IGUAL A HOMESCREEN */}
      <View style={styles.header}>
        <Ionicons name="menu" size={26} color="#FFF" />

        <Text style={styles.headerTitle}>Lista de Activos</Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => exportAssetsToExcel(assets)}
        >
          <Ionicons name="document-text-outline" size={18} color="white" />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <FlatList
        data={assets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

/* ==========================================
   🎨 ESTILOS CORPORATIVOS ACTUALIZADOS
========================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  /* 🔵 HEADER CORPORATIVO (igual que HomeScreen) */
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* 🔵 BOTÓN EXPORTAR */
  exportButton: {
    backgroundColor: "#1565C0",
    padding: 8,
    borderRadius: 10,
  },

  /* TARJETA */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  cardContent: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  status: {
    fontSize: 13,
    color: "#1E88E5",
    marginTop: 4,
    fontWeight: "600",
  },

  cardId: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});