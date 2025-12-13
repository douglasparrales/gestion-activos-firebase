import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/services/firebaseConfig";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import AssetList from "./src/screens/AssetList";
import AddAsset from "./src/screens/AddAsset";
import ScanAsset from "./src/screens/ScanAsset";
import AssetDetail from "./src/screens/AssetDetail";

import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { UserProvider } from "./src/context/UserContext";

// ----- NAVIGATORS -----
const Tabs = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ----------------------------------------------------------------------
    TABS (4 ITEMS)
    Solución: Todas las pantallas que deben coexistir con la barra de tabs
    deben vivir dentro del Tabs.Navigator, incluyendo aquellas con Header.
    Para que AssetList pueda navegar a AssetDetail, AssetList debe ser 
    envuelto en un Stack anidado, pero para no cambiar la estructura del
    Tab Navigator, simplemente moveremos AssetDetail a un Stack anidado
    donde se use.
---------------------------------------------------------------------- */

// Stack anidado para la pantalla de lista, para que pueda tener un Header y Detail
function AssetListStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaBase" component={AssetList} />
      <Stack.Screen
        name="AssetDetail"
        component={AssetDetail}
        /* ✅ CAMBIO REALIZADO: headerShown: false para quitar el Header nativo. */
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}


function TabsWrapper() {
  const insets = useSafeAreaInsets();

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
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Lista"
        // ✅ CAMBIO CLAVE: Usamos un Stack anidado para la lista
        component={AssetListStack}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Escanear"
        component={ScanAsset}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Agregar" // MANTENIDO EN TABS
        component={AddAsset}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={30} color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

/* -------------------------
    APP PRINCIPAL CON STACK
-------------------------- */
export default function App() {
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "activos"));
        console.log("Firebase conectado. Activos encontrados:");
        snapshot.forEach((doc) => console.log(doc.id, doc.data()));
      } catch (error) {
        console.error("Error Firebase:", error);
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>

            {/* 1. Tabs como pantalla principal (TODO el contenido vive aquí) */}
            <Stack.Screen name="Tabs" component={TabsWrapper} />

            {/* ❌ ELIMINADO: Estas pantallas se movieron DENTRO de Tabs (o sus Stacks anidados) 
                para asegurar que la barra de pestañas NUNCA desaparezca. */}

            {/* <Stack.Screen name="AddAsset" component={AddAsset} ... /> */}
            {/* <Stack.Screen name="AssetDetail" component={AssetDetail} ... /> */}

          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}