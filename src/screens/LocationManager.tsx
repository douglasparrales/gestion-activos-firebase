import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLocations, addLocation, Location } from "../api/locations";

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await getLocations();
    setLocations(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newLocation.trim()) {
      Alert.alert("Error", "Ingrese una ubicación");
      return;
    }

    setLoading(true);
    await addLocation(newLocation.trim());
    setNewLocation("");
    await load();
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestionar Ubicaciones</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nueva ubicación"
          value={newLocation}
          onChangeText={setNewLocation}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F7FA" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  inputRow: { flexDirection: "row", marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: "#1E88E5",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  item: {
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemText: { fontSize: 16, fontWeight: "600" },
});
