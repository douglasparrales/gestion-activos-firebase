import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

import { getAllAssets } from "../services/activosService";
import { Asset } from "../types/Asset";

// 🔐 CONTEXTO USUARIO
import { useUser } from "../context/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";

// 👇 Tipo de navegación
type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Tabs"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, setUser } = useUser();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categorias, setCategorias] = useState<any>({});

  // Cargar datos
  const loadData = async () => {
    const data = await getAllAssets();
    setAssets(data);

    const cats: any = {};
    data.forEach((item) => {
      const catName = item.categoria?.trim() || "Otros";
      cats[catName] = (cats[catName] || 0) + 1;
    });

    setCategorias(cats);
  };

  // Recargar al enfocar
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Íconos por categoría
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Equipos":
        return <MaterialIcons name="computer" size={24} color="#1E88E5" />;
      case "Mobiliario":
        return <FontAwesome5 name="chair" size={22} color="#43A047" />;
      case "Vehículos":
        return <FontAwesome5 name="car" size={22} color="#F9A825" />;
      default:
        return <MaterialIcons name="inventory" size={24} color="#E53935" />;
    }
  };

  // 🚪 LOGOUT
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            await signOut(auth);
            setUser(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <TouchableOpacity onPress={() => navigation.navigate("Configuracion" as never)}>
            <Ionicons name="settings-outline" size={26} color="#FFF" />
          </TouchableOpacity>

        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Activos</Text>
          <Text style={styles.headerUser}>
            {user?.name} ({user?.role})
          </Text>
        </View>

        <Ionicons name="search" size={26} color="#FFF" />
      </View>

      <ScrollView>

        {/* TOTAL ACTIVOS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total activos</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalNumber}>{String(assets.length)}</Text>

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("Tabs", { screen: "Agregar" })}
            >
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORÍAS */}
        <Text style={styles.sectionTitle}>Categorias</Text>

        <View style={styles.card}>
          {Object.keys(categorias).map((cat, index) => (
            <View key={cat}>
              <View style={styles.row}>
                {getCategoryIcon(cat)}
                <Text style={styles.rowText}>{cat}</Text>
                <Text style={styles.rowNumber}>
                  {String(categorias[cat])}
                </Text>
              </View>

              {index < Object.keys(categorias).length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </View>

        {/* ALERTAS */}
        <Text style={styles.sectionTitle}>Alertas</Text>

        <View style={styles.card}>
          <View style={[styles.alertBox, { backgroundColor: "#2E7D32" }]}>
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.alertText}>Activos disponibles</Text>
            <Text style={styles.alertNumber}>128</Text>
          </View>

          <View style={[styles.alertBox, { backgroundColor: "#F9A825" }]}>
            <Ionicons name="warning" size={22} color="#FFF" />
            <Text style={styles.alertText}>Mantenimiento</Text>
            <Text style={styles.alertNumber}>12</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

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
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },

  headerUser: {
    color: "#E3F2FD",
    fontSize: 12,
    marginTop: 2,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  totalNumber: {
    fontSize: 38,
    fontWeight: "700",
    color: "#111",
  },

  addButton: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#1E88E5",
    fontWeight: "600",
  },

  sectionTitle: {
    marginTop: 22,
    marginLeft: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  rowText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },

  rowNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },

  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },

  alertBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  alertText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },

  alertNumber: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
