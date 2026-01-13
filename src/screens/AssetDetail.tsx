import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// --- SISTEMA DE DISEÑO GLOBAL ---
import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";

import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAsset, deleteAsset } from "../api/assets";

type RouteProps = import("@react-navigation/native").RouteProp<RootStackParamList, "AssetDetail">;
type NavProp = import("@react-navigation/stack").StackNavigationProp<RootStackParamList, "AssetDetail">;

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Equipos": "laptop-outline",
  "Vehículos": "car-outline",
  "Otros": "cube-outline",
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
      <ActivityIndicator size="large" color={COLORS.secondary} />
      <AppText style={{ marginTop: 10 }} color={COLORS.textSecondary}>Cargando detalles...</AppText>
    </View>
  );

  if (!asset) return (
    <View style={styles.loader}>
      <Ionicons name="alert-circle-outline" size={50} color={COLORS.error} />
      <AppText bold style={{ marginTop: 10 }} color={COLORS.error}>Activo no encontrado</AppText>
    </View>
  );

  return (
    <View style={globalStyles.screen}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER COHERENTE */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <AppText bold size={18} color={COLORS.white} style={{ flex: 1, textAlign: 'center' }} numberOfLines={1}>
          {asset.nombre}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* RESUMEN FINANCIERO (MODERNO) */}
        <View style={styles.heroCard}>
            <AppText size={12} color="rgba(255,255,255,0.7)" style={{ textAlign: 'center' }}>VALOR ACTUAL ESTIMADO</AppText>
            <AppText bold size={34} color={COLORS.white} style={{ textAlign: 'center', marginVertical: 5 }}>
              {formatCurrency(dep.valorActual)}
            </AppText>
            <View style={styles.heroDivider} />
            <View style={globalStyles.rowBetween}>
                <View>
                    <AppText bold size={10} color="rgba(255,255,255,0.5)">COSTO INICIAL</AppText>
                    <AppText bold size={16} color={COLORS.white}>{formatCurrency(asset.costoInicial)}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <AppText bold size={10} color="rgba(255,255,255,0.5)">ANTIGÜEDAD</AppText>
                    <AppText bold size={16} color={COLORS.white}>{dep.anios} Años</AppText>
                </View>
            </View>
        </View>

        {/* FICHA TÉCNICA */}
        <View style={styles.sectionHeader}>
            <AppText bold size={12} color={COLORS.textSecondary}>FICHA TÉCNICA</AppText>
        </View>

        <View style={globalStyles.card}>
            <InfoItem label="ID de Activo" value={String(asset.id)} icon="finger-print-outline" />
            <InfoItem label="Categoría" value={asset.categoria} icon={CATEGORY_ICONS[asset.categoria] || "cube-outline"} />
            <InfoItem label="Estado" value={asset.estado} icon="shield-checkmark-outline" isStatus />
            <InfoItem label="Ubicación" value={asset.ubicacion} icon="location-outline" noBorder />
        </View>

        <View style={styles.sectionHeader}>
            <AppText bold size={12} color={COLORS.textSecondary}>ADQUISICIÓN</AppText>
        </View>
        <View style={globalStyles.card}>
            <InfoItem label="Fecha de Compra" value={asset.fechaAdquisicion} icon="calendar-outline" noBorder />
        </View>

        {/* 🔳 SECCIÓN QR PROFESIONAL */}
        <View style={styles.qrSection}>
          <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.qrBox}>
              <AppText bold size={16} color={COLORS.primary} style={{ textAlign: 'center', marginBottom: 2 }}>
                {String(asset.nombre).toUpperCase()}
              </AppText>
              <AppText size={11} color={COLORS.textSecondary} style={{ marginBottom: 15 }}>
                {asset.ubicacion}
              </AppText>
              
              <View style={styles.qrWrapper}>
                <QRCode value={String(asset.id)} size={180} color={COLORS.primary} />
              </View>

              <AppText bold size={14} color={COLORS.primary} style={{ marginTop: 15, letterSpacing: 2 }}>
                ID: {asset.id}
              </AppText>
            </View>
          </ViewShot>
          <AppText size={12} color={COLORS.textMuted} style={{ marginTop: 10 }}>Etiqueta oficial de control de activos</AppText>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <View style={styles.actionContainer}>
            <TouchableOpacity 
                style={styles.btnEdit}
                onPress={() => navigation.navigate("Tabs", { screen: "Agregar", params: { assetId: asset.id } })}
            >
                <Ionicons name="pencil" size={20} color={COLORS.white} />
                <AppText bold color={COLORS.white} style={{ marginLeft: 10 }}>Editar Información</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnShare} onPress={imprimirQR}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.secondary} />
                <AppText bold color={COLORS.secondary} style={{ marginLeft: 10 }}>Compartir Etiqueta QR</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <AppText bold color={COLORS.error} style={{ marginLeft: 10 }}>Eliminar Activo</AppText>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Sub-componente InfoItem optimizado
const InfoItem = ({ label, value, icon, noBorder, isStatus }: any) => (
    <View style={[styles.infoRow, noBorder && { borderBottomWidth: 0 }]}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={18} color={COLORS.secondary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText bold size={10} color={COLORS.textMuted}>{label.toUpperCase()}</AppText>
            <AppText bold={isStatus} size={15} color={isStatus ? (value?.toLowerCase().includes('activo') ? '#10B981' : COLORS.error) : COLORS.textPrimary}>
                {value || "—"}
            </AppText>
        </View>
    </View>
);

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55, 
    paddingBottom: 25, 
    paddingHorizontal: 20,
    flexDirection: "row", 
    alignItems: "center", 
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 60 },

  heroCard: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 24, 
    padding: 24, 
    marginTop: 20,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 15 },

  sectionHeader: { marginTop: 25, marginBottom: 10, paddingLeft: 5 },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },

  qrSection: { alignItems: "center", marginVertical: 30 },
  qrBox: { 
    backgroundColor: COLORS.white, 
    padding: 25, 
    borderRadius: 20, 
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 280,
    elevation: 2
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  actionContainer: { marginTop: 10, gap: 12 },
  btnEdit: { 
    backgroundColor: COLORS.secondary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16,
    elevation: 2
  },
  btnShare: { 
    backgroundColor: COLORS.white, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: COLORS.secondary 
  },
  btnDelete: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    borderRadius: 16, 
    backgroundColor: COLORS.white, 
    borderWidth: 1, 
    borderColor: COLORS.error 
  },
});