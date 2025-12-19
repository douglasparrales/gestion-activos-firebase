import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
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

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const categories = Array.from(
    new Set(assets.map((a) => a.categoria).filter(Boolean))
  );

  const filteredAssets = assets.filter((asset) => {
    const matchName = asset.nombre
      ?.toLowerCase()
      .includes(searchText.toLowerCase());

    const matchCategory = selectedCategory
      ? asset.categoria === selectedCategory
      : true;

    return matchName && matchCategory;
  });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={{ marginTop: 10, color: "#444" }}>
          Cargando activos...
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("AssetDetail", { assetId: item.id })
      }
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{String(item.nombre)}</Text>

        {item.categoria && (
          <Text style={styles.cardSubtitle}>
            {String(item.categoria)}
          </Text>
        )}

        {item.estado && (
          <Text style={styles.status}>
            Estado: {String(item.estado)}
          </Text>
        )}

        <Text style={styles.cardId}>ID: {String(item.id)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={26} color="#A0A0A0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔵 HEADER */}
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

      {/* 🔍 BUSCADOR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          placeholder="Buscar activo por nombre..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
      </View>

      {/* 🏷️ FILTROS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedCategory && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.filterText,
              !selectedCategory && styles.filterTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === cat && styles.filterTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 📋 LISTA */}
      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      />
    </View>
  );
}

/* ==========================================
   🎨 ESTILOS
========================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

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

  exportButton: {
    backgroundColor: "#1565C0",
    padding: 8,
    borderRadius: 10,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  filterContainer: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10, // 🔑 separa visualmente de la lista
  },

  filterChip: {
    height: 40,               // 🔒 ALTURA FIJA
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    marginRight: 10,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  filterChipActive: {
    backgroundColor: "#1E88E5",
  },

  filterText: {
    fontSize: 14,
    color: "#1E88E5",
    fontWeight: "600",
    lineHeight: 16,           // 🔒 evita salto vertical
  },

  filterTextActive: {
    color: "#FFFFFF",
  },



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
