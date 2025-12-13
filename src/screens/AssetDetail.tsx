import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// Tipos y APIs asumidas (Optimizadas)
import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAsset, deleteAsset } from "../api/assets";

type RouteProps = import("@react-navigation/native").RouteProp<RootStackParamList, "AssetDetail">;
type NavProp = import("@react-navigation/stack").StackNavigationProp<RootStackParamList, "AssetDetail">;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Equipos": <MaterialIcons name="computer" size={20} color="#1E88E5" />,
  "Mobiliario": <FontAwesome5 name="chair" size={18} color="#43A047" />,
  "Vehículos": <FontAwesome5 name="car" size={18} color="#F9A825" />,
  "Otros": <MaterialIcons name="inventory" size={20} color="#E53935" />,
};

const formatCurrency = (value: string | number | undefined) => `$${(Number(value) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
// Usamos Object.prototype.hasOwnProperty.call para un chequeo de categoría más seguro
const getCategoryIcon = (cat: string): React.ReactNode => Object.prototype.hasOwnProperty.call(CATEGORY_ICONS, cat) ? CATEGORY_ICONS[cat] : CATEGORY_ICONS["Otros"];

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
    const anios = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    const depreciacionTotal = costoInicial * (depreciacionAnual / 100) * anios;
    const valorActual = Math.max(costoInicial - depreciacionTotal, 0);
    return { anios, depreciacionTotal, valorActual };
  }, [asset]);

  const imprimirQR = async () => {
    try {
      const viewShot = qrRef.current;
      // Aseguramos que viewShot no sea nulo Y que la función 'capture' exista.
      if (!viewShot || !viewShot.capture) {
        console.error("Referencia QR no disponible o método capture ausente.");
        return;
      }

      const uri = await viewShot.capture();
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const html = `<html><body style="text-align:center; padding:30px; font-family:Roboto, Arial;">
<h2 style="margin-bottom:0; color:#1565C0;">${asset?.nombre || ''}</h2><h4 style="margin-top:5px; color:#5F6368;">ID: ${asset?.id || ''}</h4>
<img src="data:image/png;base64,${base64}" style="width:250px; height:250px; margin-top:30px; border: 1px solid #E0E0E0; padding: 10px; border-radius: 8px;" />
</body></html>`;
      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: 'Compartir QR' });
    } catch (error) { Alert.alert("Error", "No se pudo generar el PDF del código QR."); }
  };

  const handleDelete = () => {
    if (!asset) return;
    Alert.alert("Eliminar activo", "¿Estás seguro? Esta acción es irreversible.",
      [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: async () => { await deleteAsset(asset.id); navigation.goBack(); } }]);
  };

  // Renderizado de carga y error (ya están correctos)
  if (loading) return (<View style={styles.loader}><ActivityIndicator size="large" color="#1E88E5" /><Text style={styles.loadingText}>Cargando activo...</Text></View>);
  if (!asset) return (<View style={styles.loader}><Text style={styles.errorText}>Activo no encontrado</Text></View>);

  // Componente DetailRow REFORZADO
  const DetailRow = ({ label, value, icon, noBorder }: { label: string, value: string | number | undefined | null | boolean, icon?: React.ReactNode, noBorder?: boolean }) => {
    // ✅ CORRECCIÓN CLAVE: Aseguramos que el valor de renderizado sea siempre una cadena
    const displayValue = String(value || '') || '—';

    return (
      <View style={noBorder ? styles.detailRowNoBorder : styles.detailRow}>
        <View style={styles.rowLabelContainer}>
          {icon || null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {/* El contenido de Text es SIEMPRE una cadena no vacía */}
        <Text style={[styles.value, label === 'Estado' && { color: displayValue === 'Activo' ? '#2E7D32' : '#F9A825', fontWeight: '600' }]}>{displayValue}</Text>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      {/* 🔵 HEADER IGUAL A ASSETLIST */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 5 }} // Para hacer más fácil el toque
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {/* ✅ REFUERZO: Aseguramos que asset.nombre sea string */}
          {String(asset.nombre)}
        </Text>

        <View style={{ width: 26 }} /> {/* Espacio vacío para centrar mejor */}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* CARD PRINCIPAL: Información general */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Información general</Text>

          <DetailRow label="ID de activo" value={asset.id} icon={<Ionicons name="key-outline" size={20} color="#1E88E5" />} />

          <DetailRow label="Categoría" value={asset.categoria} icon={getCategoryIcon(asset.categoria)} />
          <DetailRow label="Estado" value={asset.estado} />
          <DetailRow label="Ubicación" value={asset.ubicacion} />
          <DetailRow label="Fecha adquisición" value={asset.fechaAdquisicion} noBorder />
        </View>

        {/* CARD FINANCIERA */}
        <View style={styles.cardFinancial}>
          <Text style={styles.cardSectionTitleWhite}>Resumen financiero</Text>
          <View style={styles.rowSpace}>
            <Text style={styles.labelWhite}>Costo inicial</Text><Text style={styles.valueWhite}>{formatCurrency(asset.costoInicial)}</Text>
          </View>
          <View style={styles.rowSpace}>
            <Text style={styles.labelWhite}>Depreciación anual</Text>
            <Text style={styles.valueWhite}>{asset.depreciacionAnual ? `${String(asset.depreciacionAnual)}%` : "—"}</Text>
          </View>
          <View style={styles.separatorDark} />
          <View style={styles.rowSpace}>
            <Text style={styles.labelWhite}>Años depreciados</Text>
            {/* ✅ CORRECCIÓN FINAL: Aseguramos que el número sea string */}
            <Text style={styles.valueWhite}>{String(dep.anios)}</Text>
          </View>
          <View style={styles.rowSpace}>
            <Text style={styles.labelWhite}>Depreciación total</Text><Text style={styles.valueWhite}>-{formatCurrency(dep.depreciacionTotal)}</Text>
          </View>
          <View style={styles.rowSpaceStrong}>
            <Text style={styles.valueStrongWhite}>Valor actual</Text><Text style={styles.valueStrongWhite}>{formatCurrency(dep.valorActual)}</Text>
          </View>
        </View>

        {/* QR SECTION */}
        <View style={styles.qrContainer}>
          <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.qrBox}>
              {/* ✅ REFUERZO: Aseguramos que asset.id sea string para el QR */}
              <QRCode value={String(asset.id)} size={160} />
            </View>
          </ViewShot>
          <Text style={styles.qrLabel}>Escanea para ver detalles del activo</Text>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() =>
            // Navega al Tab Navigator "Tabs" y especifica la pestaña "Agregar" 
            // para llevar el AssetId
            navigation.navigate("Tabs", {
              screen: "Agregar",
              params: { assetId: asset.id }
            })
          }
        >
          <Text style={styles.btnPrimaryText}>Editar activo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={imprimirQR}>
          <Text style={styles.btnSecondaryText}>Imprimir QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} onPress={handleDelete}>
          <Text style={styles.btnDangerText}>Eliminar activo</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* ============================================================
    🎨 ESTILOS (Súper compactados)
============================================================ */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  container: { padding: 20, paddingTop: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#5F6368", fontWeight: "400" },
  errorText: { fontSize: 16, color: "#D32F2F", fontWeight: "500" },

  // 🚨 ESTILOS DEL HEADER
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
    maxWidth: '75%', // Aumentado ligeramente el ancho
  },
  // 🚨 FIN ESTILOS DEL HEADER

  // Cards
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardFinancial: { backgroundColor: "#1565C0", padding: 22, borderRadius: 16, marginBottom: 20, shadowColor: "#1565C0", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  cardSectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 16, color: "#202124", borderBottomWidth: 1, borderBottomColor: "#E0E0E0", paddingBottom: 8 },
  cardSectionTitleWhite: { fontSize: 16, fontWeight: "600", marginBottom: 16, color: "#FFFFFF" },

  // Rows
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  detailRowNoBorder: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10 },
  rowSpace: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  rowSpaceStrong: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.3)" },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center' },

  // Typography & Separators
  label: { color: "#5F6368", fontSize: 15, fontWeight: "400", marginLeft: 8 },
  value: { color: "#202124", fontSize: 15, fontWeight: "500" },
  labelWhite: { color: "rgba(255, 255, 255, 0.85)", fontSize: 15, fontWeight: "400" },
  valueWhite: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  valueStrongWhite: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  separatorDark: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.25)", marginVertical: 10 },

  // QR
  qrContainer: { alignItems: "center", marginBottom: 30, marginTop: 10 },
  qrBox: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  qrLabel: { marginTop: 12, color: "#5F6368", fontSize: 14, fontWeight: "400" },

  // Buttons
  btnPrimary: { backgroundColor: "#1E88E5", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 12, shadowColor: "#1E88E5", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  btnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  btnSecondary: { backgroundColor: "#FFFFFF", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 12, borderWidth: 1.5, borderColor: "#BBDEFB", elevation: 1 },
  btnSecondaryText: { color: "#1E88E5", fontSize: 16, fontWeight: "600" },
  btnDanger: { backgroundColor: "#FFFFFF", paddingVertical: 16, borderRadius: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#D32F2F", elevation: 1 },
  btnDangerText: { color: "#D32F2F", fontSize: 16, fontWeight: "600" },
});