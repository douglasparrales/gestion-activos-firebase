import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAsset, deleteAsset } from "../api/assets";

type RouteProps = import("@react-navigation/native").RouteProp<RootStackParamList, "AssetDetail">;
type NavProp = import("@react-navigation/stack").StackNavigationProp<RootStackParamList, "AssetDetail">;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Equipos": "laptop-outline",
  "Vehículos": "car-outline",
  "Otros": "laptop-outline",
};

const formatCurrency = (value: string | number | undefined) => 
  `$${(Number(value) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AssetDetail() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const assetId = Number(route.params.assetId);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<ViewShot | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getAsset(assetId);
      setAsset(data);
      setLoading(false);
    };
    load();
  }, [assetId]);

  const dep = useMemo(() => {
    if (!asset) return { anios: 0, depreciacionTotal: 0, valorActual: 0 };
    const costoInicial = Number(asset.costoInicial) || 0;
    const depreciacionAnual = Number(asset.depreciacionAnual) || 0;
    const diffTime = new Date().getTime() - new Date(asset.fechaAdquisicion).getTime();
    const anios = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25)));
    const depreciacionTotal = costoInicial * (depreciacionAnual / 100) * anios;
    const valorActual = Math.max(costoInicial - depreciacionTotal, 0);
    return { anios, depreciacionTotal, valorActual };
  }, [asset]);

  const imprimirQR = async () => {
    try {
      if (!qrRef.current?.capture) return Alert.alert("Error", "No se pudo generar el QR");
      const uri = await qrRef.current.capture();
      const fileName = `Etiqueta_${asset?.id}.png`;
      const newPath = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: uri, to: newPath });
      await Sharing.shareAsync(newPath, { mimeType: "image/png", dialogTitle: "Compartir Etiqueta" });
    } catch (error) {
      Alert.alert("Error", "No se pudo procesar la imagen");
    }
  };

  const handleDelete = () => {
    Alert.alert("Eliminar activo", "¿Estás seguro? Esta acción es irreversible.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await deleteAsset(assetId); navigation.goBack(); } }
    ]);
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#1E88E5" />
      <Text style={styles.loadingText}>Cargando detalles...</Text>
    </View>
  );

  if (!asset) return (
    <View style={styles.loader}>
      <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
      <Text style={styles.errorText}>Activo no encontrado</Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER CON BORDES REDONDEADOS */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{asset.nombre}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* RESUMEN FINANCIERO */}
        <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Valor Actual</Text>
            <Text style={styles.heroValue}>{formatCurrency(dep.valorActual)}</Text>
            <View style={styles.heroDivider} />
            <View style={styles.heroFooter}>
                <View>
                    <Text style={styles.heroSubLabel}>Costo Inicial</Text>
                    <Text style={styles.heroSubValue}>{formatCurrency(asset.costoInicial)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.heroSubLabel}>Antigüedad</Text>
                    <Text style={styles.heroSubValue}>{dep.anios} años</Text>
                </View>
            </View>
        </View>

        {/* FICHA TÉCNICA */}
        <View style={styles.sectionHeader}>
            <Ionicons name="list-circle-outline" size={22} color="#475569" />
            <Text style={styles.sectionTitle}>Detalles Técnicos</Text>
        </View>

        <View style={styles.infoCard}>
            <InfoItem label="ID de Activo" value={String(asset.id)} icon="finger-print-outline" />
            <InfoItem label="Categoría" value={asset.categoria} icon={CATEGORY_ICONS[asset.categoria] || "cube-outline"} />
            <InfoItem label="Estado" value={asset.estado} icon="shield-checkmark-outline" isStatus />
            <InfoItem label="Ubicación" value={asset.ubicacion} icon="location-outline" />
        </View>

        <View style={styles.sectionHeader}>
            <Ionicons name="cart-outline" size={22} color="#475569" />
            <Text style={styles.sectionTitle}>Datos de Adquisición</Text>
        </View>
        <View style={styles.infoCard}>
            <InfoItem label="Fecha Adquisición" value={asset.fechaAdquisicion} icon="calendar-outline" />
        </View>

        {/* 🔳 SECCIÓN QR - ETIQUETA GRANDE E IDENTIFICABLE */}
        <View style={styles.qrContainer}>
          <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.qrBox}>
              <Text style={styles.qrTitle} numberOfLines={2}>
                {String(asset.nombre).toUpperCase()}
              </Text>

              <Text style={styles.qrSubtitle}>
                Ubicación: {String(asset.ubicacion || "—")}
              </Text>

              <View style={styles.qrWrapper}>
                {/* QR más grande que ocupa mejor el espacio */}
                <QRCode value={String(asset.id)} size={200} />
              </View>

              <Text style={styles.qrId}>
                ID DE CONTROL: {String(asset.id)}
              </Text>
            </View>
          </ViewShot>
          <Text style={styles.qrLabel}>Escanea para ver detalles técnicos</Text>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <View style={styles.actionContainer}>
            <TouchableOpacity 
                style={styles.btnEdit}
                onPress={() => navigation.navigate("Tabs", { screen: "Agregar", params: { assetId: asset.id } })}
            >
                <Ionicons name="pencil" size={20} color="#FFF" />
                <Text style={styles.btnEditText}>Editar Información</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnShare} onPress={imprimirQR}>
                <Ionicons name="share-social-outline" size={20} color="#1E88E5" />
                <Text style={styles.btnShareText}>Compartir Etiqueta QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                <Text style={styles.btnDeleteText}>Eliminar Activo</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const InfoItem = ({ label, value, icon, noBorder, isStatus }: any) => (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
        <Ionicons name={icon} size={20} color="#64748B" style={{ width: 35 }} />
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, isStatus && { color: value === 'Activo' ? '#2E7D32' : '#E65100' }]}>
                {value || "No registrado"}
            </Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontWeight: '500' },
  errorText: { marginTop: 10, color: "#D32F2F", fontWeight: '700' },
  
  header: {
    backgroundColor: "#1E88E5",
    paddingTop: 55, 
    paddingBottom: 25, 
    paddingHorizontal: 20,
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    borderBottomLeftRadius: 30, // Bordes redondeados consistentes
    borderBottomRightRadius: 30,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "800", flex: 1, textAlign: 'center' },

  scrollContainer: { paddingHorizontal: 20, paddingBottom: 50 },

  heroCard: { 
    backgroundColor: "#1E293B", borderRadius: 24, padding: 24, marginTop: 20,
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 
  },
  heroLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: '600', textAlign: 'center' },
  heroValue: { color: "#FFF", fontSize: 32, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 15 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  heroSubLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroSubValue: { color: "#FFF", fontSize: 15, fontWeight: '700', marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#475569", marginLeft: 8, textTransform: 'uppercase' },
  infoCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 10, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  infoLabel: { fontSize: 11, color: "#94A3B8", fontWeight: '700', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, color: "#1E293B", fontWeight: '600', marginTop: 1 },

  // ETIQUETA QR MEJORADA
  qrContainer: { alignItems: "center", marginVertical: 30 },
  qrBox: { 
    backgroundColor: "#FFFFFF", 
    padding: 30, 
    borderRadius: 15, 
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: '#000', // Borde negro para guía de corte al imprimir
    width: 300, 
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
    marginBottom: 6,
  },
  qrSubtitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 15,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  qrId: {
    fontSize: 15,
    color: "#000",
    marginTop: 20,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  qrLabel: { 
    marginTop: 12, 
    color: "#64748B", 
    fontSize: 13, 
    fontWeight: "500" 
  },

  actionContainer: { marginTop: 20, gap: 12 },
  btnEdit: { backgroundColor: "#1E88E5", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  btnEditText: { color: "#FFF", fontWeight: '700', fontSize: 16, marginLeft: 10 },
  btnShare: { backgroundColor: "#FFF", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#E3F2FD' },
  btnShareText: { color: "#1E88E5", fontWeight: '700', fontSize: 16, marginLeft: 10 },
  btnDelete: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: "#FEE2E2",
    marginHorizontal: 0 // Cambiado para evitar el error previo
  },
  btnDeleteText: { color: "#D32F2F", fontWeight: '700', fontSize: 16, marginLeft: 10 },
});