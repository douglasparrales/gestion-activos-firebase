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
import { exportAssetsToExcel } from "../utils/exportExcel";

type NavProp = StackNavigationProp<RootStackParamList, "AssetList">;

export default function AssetList() {
  const navigation = useNavigation<NavProp>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  
  // 🔘 Estados para los múltiples filtros
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  // 🛠️ Generar listas únicas para los filtros
  const categories = Array.from(new Set(assets.map((a) => a.categoria).filter(Boolean)));
  const locations = Array.from(new Set(assets.map((a) => a.ubicacion).filter(Boolean)));
  const statuses = Array.from(new Set(assets.map((a) => a.estado).filter(Boolean)));

  // 🔍 Lógica de Filtrado Multicapa
  const filteredAssets = assets.filter((asset) => {
    const matchName = asset.nombre?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategory ? asset.categoria === selectedCategory : true;
    const matchLocation = selectedLocation ? asset.ubicacion === selectedLocation : true;
    const matchStatus = selectedStatus ? asset.estado === selectedStatus : true;

    return matchName && matchCategory && matchLocation && matchStatus;
  });

  const renderFilterSection = (
    title: string, 
    data: string[], 
    selected: string | null, 
    onSelect: (val: string | null) => void,
    icon: any
  ) => (
    <View style={styles.filterSection}>
      <View style={styles.filterHeader}>
        <Ionicons name={icon} size={16} color="#666" />
        <Text style={styles.filterTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterChip, !selected && styles.filterChipActive]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.filterText, !selected && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {data.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, selected === item && styles.filterChipActive]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.filterText, selected === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
      onPress={() => navigation.navigate("AssetDetail", { assetId: item.id })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{String(item.nombre)}</Text>
        <Text style={styles.cardSubtitle}>📍 {item.ubicacion || "Sin ubicación"}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.tag}><Text style={styles.tagText}>{item.categoria}</Text></View>
          <Text style={styles.statusText}>• {item.estado}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#A0A0A0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔵 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activos</Text>
        <TouchableOpacity style={styles.exportButton} onPress={() => exportAssetsToExcel(assets)}>
          <Ionicons name="download-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* 🔍 BUSCADOR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput
          placeholder="Buscar por nombre..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholderTextColor="#999"
        />
        { (selectedCategory || selectedLocation || selectedStatus || searchText) && (
            <TouchableOpacity onPress={() => {
                setSelectedCategory(null);
                setSelectedLocation(null);
                setSelectedStatus(null);
                setSearchText("");
            }}>
                <Text style={{color: '#E53935', fontSize: 12, fontWeight: '700'}}>LIMPIAR</Text>
            </TouchableOpacity>
        )}
      </View>

      {/* 🏷️ SECCIÓN DE FILTROS (SCROLLABLE) */}
      <View style={{ maxHeight: 200 }}>
        <ScrollView style={styles.filtersWrapper}>
            {renderFilterSection("Categoría", categories, selectedCategory, setSelectedCategory, "pricetag-outline")}
            {renderFilterSection("Ubicación", locations, selectedLocation, setSelectedLocation, "location-outline")}
            {renderFilterSection("Estado", statuses, selectedStatus, setSelectedStatus, "stats-chart-outline")}
        </ScrollView>
      </View>

      {/* 📋 LISTA */}
      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
                No se encontraron activos con estos filtros.
            </Text>
        }
      />
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
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  exportButton: { backgroundColor: "#1565C0", padding: 8, borderRadius: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFF",
    marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#333" },
  
  // Estilos de filtros nuevos
  filtersWrapper: { paddingHorizontal: 16, marginTop: 10 },
  filterSection: { marginBottom: 12 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  filterTitle: { fontSize: 12, fontWeight: '700', color: '#666', marginLeft: 5, textTransform: 'uppercase' },
  filterChip: {
    paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#FFF", marginRight: 8, borderWidth: 1, borderColor: '#E3F2FD'
  },
  filterChipActive: { backgroundColor: "#1E88E5", borderColor: '#1E88E5' },
  filterText: { fontSize: 13, color: "#1E88E5", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15,
    flexDirection: "row", alignItems: "center", elevation: 2,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  cardSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  tag: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#1E88E5', fontWeight: '700' },
  statusText: { fontSize: 12, color: '#4CAF50', marginLeft: 8, fontWeight: '600' },
});