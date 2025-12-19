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
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAllAssets } from "../api/assets";
import { Ionicons } from "@expo/vector-icons";
import { exportAssetsToExcel } from "../utils/exportExcel";

// Importaciones para QR Masivo
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type NavProp = StackNavigationProp<RootStackParamList, "AssetList">;

export default function AssetList() {
  const navigation = useNavigation<NavProp>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
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

  // --- LÓGICA DE GENERACIÓN DE QR ---
  const generateQRDirectory = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    const assetsInLocation = filteredAssets;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; text-align: center; }
            h1 { color: #1E88E5; margin-bottom: 5px; }
            p { color: #666; margin-bottom: 30px; }
            .grid { display: flex; flex-wrap: wrap; justify-content: center; }
            .qr-card { 
              border: 1px solid #ddd; 
              margin: 10px; 
              padding: 15px; 
              width: 180px; 
              border-radius: 10px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .name { font-weight: bold; font-size: 12px; height: 30px; overflow: hidden; margin-bottom: 10px; }
            .id { font-size: 10px; color: #888; margin-top: 5px; }
            img { width: 130px; height: 130px; }
          </style>
        </head>
        <body>
          <h1>Etiquetas de Activos</h1>
          <p>Ubicación: ${selectedLocation}</p>
          <div class="grid">
            ${assetsInLocation.map(asset => `
              <div class="qr-card">
                <div class="name">${String(asset.nombre).toUpperCase()}</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${asset.id}" />
                <div class="id">ID: ${asset.id}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el archivo de QRs.");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(assets.map((a) => a.categoria).filter(Boolean)));
  const locations = Array.from(new Set(assets.map((a) => a.ubicacion).filter(Boolean)));
  const statuses = Array.from(new Set(assets.map((a) => a.estado).filter(Boolean)));

  const filteredAssets = assets.filter((asset) => {
    const matchName = asset.nombre?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategory ? asset.categoria === selectedCategory : true;
    const matchLocation = selectedLocation ? asset.ubicacion === selectedLocation : true;
    const matchStatus = selectedStatus ? asset.estado === selectedStatus : true;
    return matchName && matchCategory && matchLocation && matchStatus;
  });

  const renderFilterSection = (title: string, data: string[], selected: string | null, onSelect: (val: string | null) => void, icon: any) => (
    <View style={styles.filterSection}>
      <View style={styles.filterHeader}>
        <Ionicons name={icon} size={16} color="#666" />
        <Text style={styles.filterTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={[styles.filterChip, !selected && styles.filterChipActive]} onPress={() => onSelect(null)}>
          <Text style={[styles.filterText, !selected && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {data.map((item) => (
          <TouchableOpacity key={item} style={[styles.filterChip, selected === item && styles.filterChipActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.filterText, selected === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("AssetDetail", { assetId: item.id })}>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={26} color="#FFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Activos</Text>
        <TouchableOpacity style={styles.exportButton} onPress={() => exportAssetsToExcel(assets)}>
          <Ionicons name="download-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" />
        <TextInput placeholder="Buscar por nombre..." value={searchText} onChangeText={setSearchText} style={styles.searchInput} placeholderTextColor="#999" />
        {(selectedCategory || selectedLocation || selectedStatus || searchText) && (
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setSelectedLocation(null); setSelectedStatus(null); setSearchText(""); }}>
            <Text style={{color: '#E53935', fontSize: 12, fontWeight: '700'}}>LIMPIAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🏷️ SECCIÓN DE FILTROS */}
      <View style={{ maxHeight: 200 }}>
        <ScrollView style={styles.filtersWrapper}>
          {renderFilterSection("Categoría", categories, selectedCategory, setSelectedCategory, "pricetag-outline")}
          {renderFilterSection("Ubicación", locations, selectedLocation, setSelectedLocation, "location-outline")}
          {renderFilterSection("Estado", statuses, selectedStatus, setSelectedStatus, "stats-chart-outline")}
        </ScrollView>
      </View>

      {/* 🚀 BOTÓN DINÁMICO DE DESCARGA QR */}
      {selectedLocation && filteredAssets.length > 0 && (
        <TouchableOpacity style={styles.qrDownloadBtn} onPress={generateQRDirectory}>
          <Ionicons name="qr-code-outline" size={20} color="#FFF" />
          <Text style={styles.qrDownloadText}>Descargar QRs de {selectedLocation}</Text>
          <View style={styles.qrBadge}><Text style={styles.qrBadgeText}>{filteredAssets.length}</Text></View>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No se encontraron activos.</Text>}
      />
      
      {loading && (
        <View style={styles.absLoader}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: { backgroundColor: "#1E88E5", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, elevation: 4 },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  exportButton: { backgroundColor: "#1565C0", padding: 8, borderRadius: 10 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", marginHorizontal: 16, marginTop: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#333" },
  filtersWrapper: { paddingHorizontal: 16, marginTop: 10 },
  filterSection: { marginBottom: 12 },
  filterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  filterTitle: { fontSize: 12, fontWeight: '700', color: '#666', marginLeft: 5, textTransform: 'uppercase' },
  filterChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: "#FFF", marginRight: 8, borderWidth: 1, borderColor: '#E3F2FD' },
  filterChipActive: { backgroundColor: "#1E88E5", borderColor: '#1E88E5' },
  filterText: { fontSize: 13, color: "#1E88E5", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  
  // Nuevo botón de descarga QR
  qrDownloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    marginHorizontal: 16,
    marginTop: 5,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3
  },
  qrDownloadText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 13 },
  qrBadge: { backgroundColor: '#FFF', marginLeft: 10, paddingHorizontal: 6, borderRadius: 10 },
  qrBadgeText: { color: '#2E7D32', fontSize: 10, fontWeight: '900' },

  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15, flexDirection: "row", alignItems: "center", elevation: 2 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  cardSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  tag: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#1E88E5', fontWeight: '700' },
  statusText: { fontSize: 12, color: '#4CAF50', marginLeft: 8, fontWeight: '600' },
  absLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }
});