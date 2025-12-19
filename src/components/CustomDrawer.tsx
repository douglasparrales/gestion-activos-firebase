import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useUser } from "../context/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

export default function CustomDrawer(props: any) {
  const { user, setUser, loginTime } = useUser();

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* PERFIL */}
      <View style={styles.profile}>
        <Ionicons name="person-circle" size={70} color="#1E88E5" />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Text style={styles.meta}>
          Inicio: {loginTime?.toLocaleString()}
        </Text>
        <Text style={styles.meta}>
          Último login: {user?.lastLogin}
        </Text>
      </View>

      {/* ITEMS */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate("HomeTabs")}
      >
        <Ionicons name="home" size={22} />
        <Text style={styles.itemText}>Inicio</Text>
      </TouchableOpacity>

      {user?.role === "admin" && (
        <TouchableOpacity
          style={styles.item}
          onPress={() => props.navigation.navigate("CrearUsuario")}
        >
          <Ionicons name="person-add" size={22} />
          <Text style={styles.itemText}>Crear usuario</Text>
        </TouchableOpacity>
      )}

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color="#FFF" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  profile: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#EEE",
  },
  name: { fontSize: 18, fontWeight: "700" },
  email: { fontSize: 14, color: "#555" },
  meta: { fontSize: 12, color: "#777", marginTop: 4 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  itemText: { marginLeft: 12, fontSize: 16 },

  logout: {
    margin: 16,
    backgroundColor: "#E53935",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 10,
  },
});
