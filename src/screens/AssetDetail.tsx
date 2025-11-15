import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";
import { Asset } from "../types/Asset";
import { getAsset, deleteAsset } from "../api/assets";
import QRCode from "react-native-qrcode-svg";

import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import * as FileSystem from "expo-file-system/legacy";



type NavProp = StackNavigationProp<RootStackParamList, "AssetDetail">;
type RouteProps = RouteProp<RootStackParamList, "AssetDetail">;

export default function AssetDetail() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const assetId = Number(route.params.assetId);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  const qrRef = useRef<ViewShot | null>(null);

  /* ====================================================
      🔹 Depreciación automática
  ==================================================== */
  const calcularDepreciacion = () => {
    if (!asset?.costoInicial || !asset?.depreciacionAnual) {
      return {
        anios: 0,
        depreciacionTotal: 0,
        valorActual: asset?.costoInicial ?? 0,
      };
    }

    const fechaAdq = new Date(asset.fechaAdquisicion);
    const hoy = new Date();

    const diff = hoy.getTime() - fechaAdq.getTime();
    const anios = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

    const depreciacionTotal =
      asset.costoInicial * (asset.depreciacionAnual / 100) * anios;

    const valorActual = Math.max(asset.costoInicial - depreciacionTotal, 0);

    return { anios, depreciacionTotal, valorActual };
  };

  const dep = calcularDepreciacion();

  /* ====================================================
      🔹 Cargar Asset
  ==================================================== */
  useEffect(() => {
    const load = async () => {
      const data = await getAsset(assetId);
      setAsset(data);
      setLoading(false);
    };
    load();
  }, [assetId]);

  /* ====================================================
      🔹 Imprimir QR (PDF)
  ==================================================== */
  const imprimirQR = async () => {
    try {
      const viewShot = qrRef.current;
      if (!viewShot || !viewShot.capture) return;

      // 📸 Capturamos el QR como archivo PNG
      const fileUri = await viewShot.capture();

      // 🔄 Convertimos el archivo PNG a base64 (ESTO ES LO QUE FALTABA)
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 📄 Insertamos imagen base64 en el PDF
      const html = `
      <html>
        <body style="text-align:center; padding:30px; font-family:Arial;">
          <h2 style="margin-bottom:0;">${asset?.nombre}</h2>
          <h4 style="margin-top:5px; color:#555;">ID: ${asset?.id}</h4>

          <img
            src="data:image/png;base64,${base64}"
            style="width:250px; height:250px; margin-top:20px;"
          />
        </body>
      </html>
    `;

      const { uri: pdfUri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      console.log("Error imprimiendo QR:", error);
    }
  };



  /* ====================================================
      🔹 Loading / Not Found
  ==================================================== */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando activo...</Text>
      </View>
    );
  }

  if (!asset) {
    return (
      <View style={styles.center}>
        <Text>❌ Activo no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* HEADER */}
      <Text style={styles.headerTitle}>{asset.nombre}</Text>
      <Text style={styles.headerSubtitle}>ID • {asset.id}</Text>

      {/* CARD PRINCIPAL */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Información general</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Categoría</Text>
          <Text style={styles.value}>{asset.categoria}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Estado</Text>
          <Text style={styles.value}>{asset.estado}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Ubicación</Text>
          <Text style={styles.value}>{asset.ubicacion}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>Fecha adquisición</Text>
          <Text style={styles.value}>{asset.fechaAdquisicion}</Text>
        </View>
      </View>

      {/* CARD FINANCIERA */}
      <View style={styles.cardFinancial}>
        <Text style={styles.cardSectionTitleWhite}>Resumen financiero</Text>

        <View style={styles.rowSpace}>
          <Text style={styles.labelWhite}>Costo inicial</Text>
          <Text style={styles.valueWhite}>
            ${asset.costoInicial?.toFixed(2) ?? "—"}
          </Text>
        </View>

        <View style={styles.rowSpace}>
          <Text style={styles.labelWhite}>Depreciación anual</Text>
          <Text style={styles.valueWhite}>
            {asset.depreciacionAnual ?? "—"}%
          </Text>
        </View>

        <View style={styles.separatorDark} />

        <View style={styles.rowSpace}>
          <Text style={styles.labelWhite}>Años depreciados</Text>
          <Text style={styles.valueWhite}>{dep.anios}</Text>
        </View>

        <View style={styles.rowSpace}>
          <Text style={styles.labelWhite}>Depreciación total</Text>
          <Text style={styles.valueWhite}>
            ${dep.depreciacionTotal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rowSpace}>
          <Text style={styles.valueStrongWhite}>Valor actual</Text>
          <Text style={styles.valueStrongWhite}>
            ${dep.valorActual.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* QR */}
      <View style={styles.qrContainer}>
        <ViewShot ref={qrRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.qrBox}>
            <QRCode value={String(asset.id)} size={160} />
          </View>
        </ViewShot>

        <Text style={styles.qrLabel}>Código QR del activo</Text>
      </View>

      {/* BOTÓN IMPRIMIR */}
      <TouchableOpacity style={styles.btnPrimary} onPress={imprimirQR}>
        <Text style={styles.btnPrimaryText}>Imprimir QR</Text>
      </TouchableOpacity>

      {/* BOTÓN EDITAR */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate("AddAsset", { assetId: asset.id })}
      >
        <Text style={styles.btnPrimaryText}>Editar activo</Text>
      </TouchableOpacity>

      {/* BOTÓN ELIMINAR */}
      <TouchableOpacity
        style={styles.btnDanger}
        onPress={() =>
          Alert.alert(
            "Eliminar activo",
            "¿Estás seguro de que deseas eliminar este activo?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  await deleteAsset(asset.id);
                  navigation.goBack();
                },
              },
            ]
          )
        }
      >
        <Text style={styles.btnDangerText}>Eliminar activo</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ============================================================
    🎨 ESTILOS PREMIUM (NO SE TOCARON)
============================================================ */
const styles = StyleSheet.create({
  container: { padding: 20 },

  headerTitle: { fontSize: 28, fontWeight: "700", color: "#222" },
  headerSubtitle: { fontSize: 16, color: "#666", marginBottom: 18 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#444" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardFinancial: {
    backgroundColor: "#0056A3",
    padding: 20,
    borderRadius: 16,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  cardSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },
  cardSectionTitleWhite: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "white",
  },

  row: { marginBottom: 12 },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  label: { color: "#666", fontSize: 14, fontWeight: "600" },
  value: { color: "#111", fontSize: 16, fontWeight: "600" },

  labelWhite: { color: "#D8E8FF", fontSize: 14 },
  valueWhite: { color: "white", fontSize: 16, fontWeight: "600" },
  valueStrongWhite: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  separator: { height: 1, backgroundColor: "#EEE", marginVertical: 12 },
  separatorDark: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 12,
  },

  qrContainer: { alignItems: "center", marginBottom: 15 },
  qrBox: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrLabel: { marginTop: 8, color: "#777" },

  btnPrimary: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  btnPrimaryText: { color: "white", fontSize: 17, fontWeight: "700" },

  btnDanger: {
    backgroundColor: "#D9534F",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDangerText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});
