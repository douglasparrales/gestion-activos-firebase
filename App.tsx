import React, { useEffect } from "react";
import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/services/firebaseConfig";

import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { UserProvider, useUser } from "./src/context/UserContext";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import AssetList from "./src/screens/AssetList";
import AddAsset from "./src/screens/AddAsset";
import ScanAsset from "./src/screens/ScanAsset";
import AssetDetail from "./src/screens/AssetDetail";
import LoginScreen from "./src/screens/LoginScreen";
import CreateUserScreen from "./src/screens/CreateUserScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

// ---------------- NAVIGATORS ----------------
const Tabs = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ----------------------------------------------------------------------
   STACK PARA LISTA
---------------------------------------------------------------------- */
function AssetListStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaBase" component={AssetList} />
      <Stack.Screen name="AssetDetail" component={AssetDetail} />
    </Stack.Navigator>
  );
}

/* ----------------------------------------------------------------------
   TABS
---------------------------------------------------------------------- */
function TabsWrapper() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#777",
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Lista"
        component={AssetListStack}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Escanear"
        component={ScanAsset}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Agregar"
        component={AddAsset}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Configuracion"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Ajustes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

/* ----------------------------------------------------------------------
   STACK PRINCIPAL
---------------------------------------------------------------------- */
function MainNavigator() {
  const { user } = useUser();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={TabsWrapper} />
          <Stack.Screen name="CrearUsuario" component={CreateUserScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

/* ----------------------------------------------------------------------
   APP
---------------------------------------------------------------------- */
export default function App() {
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "activos"));
        console.log("Firebase conectado:", snapshot.size);
      } catch (error) {
        console.error("Error Firebase:", error);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}
