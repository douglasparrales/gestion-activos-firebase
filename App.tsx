import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator, BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/services/firebaseConfig";
import { RootStackParamList } from "./src/types/navigation";

// Screens
import AssetList from "./src/screens/AssetList";
import AddAsset from "./src/screens/AddAsset";
import ScanAsset from "./src/screens/ScanAsset";
import AssetDetail from "./src/screens/AssetDetail";

// Safe Area
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

const Stack = createStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

/* -----------------------------------------------------
   STACK — Lista → Detalle → Agregar
------------------------------------------------------ */
function AssetStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AssetList" component={AssetList} options={{ title: "Activos" }} />
      <Stack.Screen name="AssetDetail" component={AssetDetail} options={{ title: "Detalle del Activo" }} />
      <Stack.Screen name="AddAsset" component={AddAsset} options={{ title: "Registrar / Editar Activo" }} />
    </Stack.Navigator>
  );
}

/* -----------------------------------------------------
   BOTÓN CENTRAL — Tipado seguro
------------------------------------------------------ */
interface CentralTabButtonProps extends BottomTabBarButtonProps {
  children: React.ReactNode;
}

function CentralTabButton({ children, onPress }: CentralTabButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={(e: GestureResponderEvent) => {
        bounce();
        onPress?.(e);
      }}
      style={styles.centerTabWrapper}
    >
      <Animated.View style={[styles.centerTabButton, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* -----------------------------------------------------
   TABS — Barra estilo WhatsApp
------------------------------------------------------ */
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
        name="Activos"
        component={AssetStack}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="Agregar"
        component={AddAsset}
        options={{
          tabBarLabel: "",
          tabBarButton: (props) => (
            <CentralTabButton {...props}>
              <Ionicons name="add" size={36} color="white" />
            </CentralTabButton>
          ),
        }}
      />

      <Tabs.Screen
        name="Escanear"
        component={ScanAsset}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="qr-code-outline" size={26} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

/* -----------------------------------------------------
   APP PRINCIPAL
------------------------------------------------------ */
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
      <NavigationContainer>
        <TabsWrapper />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/* -----------------------------------------------------
   ESTILOS PREMIUM
------------------------------------------------------ */
const styles = StyleSheet.create({
  centerTabWrapper: {
    position: "relative",
    top: -15,
    justifyContent: "center",
    alignItems: "center",
  },

  centerTabButton: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
});
