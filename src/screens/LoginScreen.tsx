import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useUser } from "../context/UserContext";

export default function LoginScreen() {
  const { setUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 1️⃣ Estado para mostrar / ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "El formato del email no es válido.";
      case "auth/user-not-found":
        return "No existe una cuenta con este email.";
      case "auth/wrong-password":
        return "La contraseña es incorrecta.";
      case "auth/invalid-credential":
        return "Credenciales incorrectas. Verifica tu email y contraseña.";
      case "auth/network-request-failed":
        return "Error de conexión. Revisa tu internet.";
      default:
        return "Ocurrió un error inesperado. Inténtalo de nuevo.";
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos incompletos", "Por favor, llena todos los campos.");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Email inválido", "Por favor ingresa un correo electrónico real.");
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, "usuarios", uid));

      if (!userDoc.exists()) {
        Alert.alert("Error de Perfil", "El usuario no tiene un perfil asignado.");
        return;
      }

      const userData = userDoc.data();
      setUser({
        uid,
        email: userCredential.user.email,
        name: userData.name,
        role: userData.role,
      });

    } catch (error: any) {
      const message = getFriendlyErrorMessage(error.code);
      Alert.alert("Error de inicio de sesión", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#1E88E5" style={styles.logo} />
        <Text style={styles.title}>Bienvenido</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Correo electrónico"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
        </View>

        {/* 2️⃣ Input de contraseña modificado */}
        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color="#666" style={styles.icon} />

          <TextInput
            placeholder="Contraseña"
            style={styles.input}
            secureTextEntry={!showPassword} // Dinámico según el estado
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 40,
    color: "#1A1A1A",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#1E88E5",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: "#90CAF9",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});