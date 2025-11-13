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

type NavProp = StackNavigationProp<RootStackParamList, "AssetList">;

export default function AssetList() {
  const navigation = useNavigation<NavProp>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     🔄 Refrescar la lista cada vez que se vuelva a esta pantalla
  ====================================================== */
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
        <ActivityIndicator size="large" color="#007AFF" />
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
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{item.nombre}</Text>

        {item.categoria ? (
          <Text style={styles.cardSubtitle}>{item.categoria}</Text>
        ) : null}

        {item.estado ? (
          <Text style={styles.status}>Estado: {item.estado}</Text>
        ) : null}

        <Text style={styles.cardId}>ID: {item.id}</Text>
      </View>

      <Ionicons name="chevron-forward" size={26} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={assets}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
}

/* ======================================================
   🎨 ESTILOS MEJORADOS — premium style
====================================================== */
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Tarjeta del activo */
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardLeft: {
    flexDirection: "column",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  status: {
    fontSize: 13,
    color: "#007AFF",
    marginTop: 4,
    fontWeight: "600",
  },

  cardId: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
});
