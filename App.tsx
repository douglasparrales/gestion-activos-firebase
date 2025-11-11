import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AddAsset from "./src/screens/AddAsset";
import ScanAsset from "./src/screens/ScanAsset";
import { Button } from "react-native";

import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/services/firebaseConfig";

const Stack = createStackNavigator();

export default function App() {
  // 🔹 Prueba de conexión a Firebase
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, "activos"));
        console.log("✅ Firebase conectado, activos encontrados:");
        snapshot.forEach((doc) => console.log(doc.id, doc.data()));
      } catch (error) {
        console.error("❌ Error al conectar con Firebase:", error);
      }
    })();
  }, []);

  // 🔹 Tu navegación sigue igual
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="AddAsset"
          component={AddAsset}
          options={({ navigation }) => ({
            title: "Registrar Activo",
            headerRight: () => (
              <Button title="Escanear" onPress={() => navigation.navigate("ScanAsset")} />
            ),
          })}
        />
        <Stack.Screen name="ScanAsset" component={ScanAsset} options={{ title: "Escanear QR" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
