import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAllAssets } from "../api/assets";
import { Ionicons } from "@expo/vector-icons";
import { exportAssetsToExcel } from "../utils/exportExcel";

// --- SISTEMA DE DISEÑO GLOBAL ---
import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type NavProp = StackNavigationProp<RootStackParamList, "AssetList">;

export default function AssetList() {
  const navigation = useNavigation<NavProp>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  
  // Estados para controlar qué filtro está "abierto" visualmente
  const [activeFilterTab, setActiveFilterTab] = useState<'cat' | 'loc' | 'stat' | null>('cat');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getAllAssets();
      setAssets(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los activos.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadAssets(); }, []));

  const filteredAssets = assets.filter((asset) => {
    const matchName = asset.nombre?.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = selectedCategory ? asset.categoria === selectedCategory : true;
    const matchLocation = selectedLocation ? asset.ubicacion === selectedLocation : true;
    const matchStatus = selectedStatus ? asset.estado === selectedStatus : true;
    return matchName && matchCategory && matchLocation && matchStatus;
  });

  const categories = Array.from(new Set(assets.map((a) => a.categoria).filter(Boolean)));
  const locations = Array.from(new Set(assets.map((a) => a.ubicacion).filter(Boolean)));
  const statuses = Array.from(new Set(assets.map((a) => a.estado).filter(Boolean)));

  const generateQRDirectory = async () => {
    if (!selectedLocation) return;
    setLoading(true);
    const htmlContent = `<html>...</html>`; // Mantener tu lógica de HTML actual
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO DE OPCIONES COMPACTAS ---
  const renderFilterOptions = () => {
    let items: string[] = [];
    let selected: string | null = null;
    let onSelect: (v: string | null) => void = () => {};

    if (activeFilterTab === 'cat') { items = categories; selected = selectedCategory; onSelect = setSelectedCategory; }
    if (activeFilterTab === 'loc') { items = locations; selected = selectedLocation; onSelect = setSelectedLocation; }
    if (activeFilterTab === 'stat') { items = statuses; selected = selectedStatus; onSelect = setSelectedStatus; }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        <TouchableOpacity 
          style={[styles.optionChip, !selected && styles.optionChipActive]} 
          onPress={() => onSelect(null)}
        >
          <AppText size={12} color={!selected ? COLORS.white : COLORS.textSecondary}>Todos</AppText>
        </TouchableOpacity>
        {items.map(item => (
          <TouchableOpacity 
            key={item} 
            style={[styles.optionChip, selected === item && styles.optionChipActive]} 
            onPress={() => onSelect(item)}
          >
            <AppText size={12} color={selected === item ? COLORS.white : COLORS.textSecondary}>{item}</AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={globalStyles.screen}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={globalStyles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <AppText bold size={18} color={COLORS.white}>LISTADO DE ACTIVOS</AppText>
          <TouchableOpacity style={styles.actionBtn} onPress={() => exportAssetsToExcel(assets)}>
            <Ionicons name="share-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
          <TextInput 
            placeholder="Buscar por nombre..." 
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* NUEVA SECCIÓN DE FILTROS COMPACTA */}
      <View style={styles.compactFilterWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => setActiveFilterTab('cat')}
            style={[styles.filterTab, activeFilterTab === 'cat' && styles.activeTab]}
          >
            <AppText bold={activeFilterTab === 'cat'} size={12} color={activeFilterTab === 'cat' ? COLORS.secondary : COLORS.textSecondary}>Categoría</AppText>
            {selectedCategory && <View style={styles.dotIndicator} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setActiveFilterTab('loc')}
            style={[styles.filterTab, activeFilterTab === 'loc' && styles.activeTab]}
          >
            <AppText bold={activeFilterTab === 'loc'} size={12} color={activeFilterTab === 'loc' ? COLORS.secondary : COLORS.textSecondary}>Ubicación</AppText>
            {selectedLocation && <View style={styles.dotIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveFilterTab('stat')}
            style={[styles.filterTab, activeFilterTab === 'stat' && styles.activeTab]}
          >
            <AppText bold={activeFilterTab === 'stat'} size={12} color={activeFilterTab === 'stat' ? COLORS.secondary : COLORS.textSecondary}>Estado</AppText>
            {selectedStatus && <View style={styles.dotIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Sub-opciones desplegables */}
        <View style={styles.optionsWrapper}>
          {renderFilterOptions()}
        </View>
      </View>

      {selectedLocation && (
        <TouchableOpacity style={styles.qrBtn} onPress={generateQRDirectory}>
          <Ionicons name="qr-code" size={16} color={COLORS.white} />
          <AppText bold size={12} color={COLORS.white} style={{ marginLeft: 8 }}>Etiquetas {selectedLocation} ({filteredAssets.length})</AppText>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredAssets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[globalStyles.card, styles.itemCard]}
            onPress={() => navigation.navigate("AssetDetail", { assetId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <AppText bold size={15}>{item.nombre}</AppText>
              <AppText size={12} color={COLORS.textSecondary}>{item.ubicacion}</AppText>
              <View style={styles.badgeRow}>
                <View style={styles.miniBadge}><AppText size={9}>{item.categoria}</AppText></View>
                <AppText bold size={10} color={item.estado?.toLowerCase().includes('activo') ? '#10B981' : '#EF4444'}>
                  ● {item.estado}
                </AppText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
          </TouchableOpacity>
        )}
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backBtn: { width: 30 },
  actionBtn: { width: 30, alignItems: 'flex-end' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginTop: 15,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.textPrimary },
  
  // ESTILOS FILTROS COMPACTOS
  compactFilterWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.secondary,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
    marginTop: 2,
  },
  optionsWrapper: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
  },
  optionsScroll: {
    paddingLeft: 20,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },

  qrBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    margin: 15,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 15, paddingBottom: 100 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 12,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  miniBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }
});