import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useUser } from "../context/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const { user, setUser } = useUser();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <Text style={styles.value}>{user?.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </View>

      {user?.role === "admin" && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => navigation.navigate("CrearUsuario" as never)}
        >
          <Text style={styles.adminButtonText}>Crear nuevo usuario</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F7FA",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  adminButton: {
    backgroundColor: "#1E88E5",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  adminButtonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#E53935",
    padding: 14,
    borderRadius: 12,
  },
  logoutText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "600",
  },
});
