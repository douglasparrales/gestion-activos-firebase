import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

// 1. Importación del componente personalizado
import GlobalTextInput from "../components/GlobalTextInput";

export default function SettingsScreen() {
    const { user, setUser } = useUser();
    const navigation = useNavigation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", style: "destructive", onPress: async () => { await signOut(auth); setUser(null); } },
        ]);
    };

    const handleCreateUser = async () => {
        if (!name || !email || !password) return Alert.alert("Error", "Completa todos los campos");
        try {
            setLoading(true);
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "usuarios", cred.user.uid), { name, email, role: "user", createdAt: new Date() });
            
            Alert.alert("Éxito", `Usuario ${name} creado. El administrador sigue en sesión.`);
            setName(""); setEmail(""); setPassword("");
        } catch (error: any) { 
            Alert.alert("Error", "No se pudo crear el usuario. Verifique los datos."); 
        } finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Configuración</Text>
                <Text style={styles.subtitle}>Gestiona tu cuenta y la aplicación</Text>
            </View>

            {/* 👤 SECCIÓN DE PERFIL */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-circle-outline" size={20} color="#1E88E5" />
                    <Text style={styles.sectionTitle}>Mi Perfil</Text>
                </View>
                
                <View style={styles.profileInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nombre</Text>
                        <Text style={styles.value}>{user?.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <Text style={styles.value}>{user?.email}</Text>
                    </View>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {/* 👑 PANEL DE ADMINISTRADOR */}
            {user?.role === "admin" && (
                <>
                    <Text style={styles.groupLabel}>ADMINISTRACIÓN DE SISTEMA</Text>
                    
                    {/* Gestión de Catálogos */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitleSmall}>Catálogos y Listas</Text>
                        <View style={{ marginBottom: 15 }}>
                           <View style={styles.buttonGrid}>
                                <TouchableOpacity 
                                    style={[styles.actionButton, { backgroundColor: "#E8F5E9" }]} 
                                    onPress={() => navigation.navigate("CategoryManager" as never)}
                                >
                                    <Ionicons name="pricetags" size={24} color="#2E7D32" />
                                    <Text style={[styles.actionButtonText, { color: "#2E7D32" }]}>Categorías</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionButton, { backgroundColor: "#E0F2F1" }]} 
                                    onPress={() => navigation.navigate("LocationManager" as never)}
                                >
                                    <Ionicons name="business" size={24} color="#00695C" />
                                    <Text style={[styles.actionButtonText, { color: "#00695C" }]}>Ubicaciones</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Registro de Usuarios */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitleSmall}>Registrar Nuevo Usuario</Text>
                        
                        {/* 2. Sustitución por GlobalTextInput */}
                        <GlobalTextInput 
                            label="Nombre completo"
                            placeholder="Nombre completo"
                            value={name}
                            onChangeText={setName}
                        />

                        <GlobalTextInput 
                            label="Correo electrónico"
                            placeholder="Correo electrónico"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <GlobalTextInput 
                            label="Contraseña"
                            placeholder="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        
                        <TouchableOpacity 
                            style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                            onPress={handleCreateUser} 
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : (
                                <>
                                    <Ionicons name="person-add-outline" size={20} color="#FFF" style={{marginRight: 8}} />
                                    <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* 🚪 CIERRE DE SESIÓN */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#E53935" />
                <Text style={styles.logoutText}>Cerrar Sesión Activa</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 20 },
    header: { marginTop: 40, marginBottom: 25 },
    title: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
    subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
    
    groupLabel: { fontSize: 12, fontWeight: "700", color: "#94A3B8", marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
    
    card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20, marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: "700", marginLeft: 8, color: "#1E293B" },
    sectionTitleSmall: { fontSize: 15, fontWeight: "700", color: "#475569", marginBottom: 15 },
    
    profileInfo: { gap: 12 },
    infoRow: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 8 },
    label: { fontSize: 11, color: "#94A3B8", textTransform: 'uppercase', fontWeight: '600' },
    value: { fontSize: 16, fontWeight: "600", color: "#1E293B", marginTop: 2 },
    
    roleBadge: { alignSelf: 'flex-start', backgroundColor: "#E0F2FE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 5 },
    roleText: { color: "#0369A1", fontSize: 11, fontWeight: "800" },

    buttonGrid: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 5 },
    actionButtonText: { fontSize: 13, fontWeight: "700" },

    primaryButton: { backgroundColor: "#1E88E5", paddingVertical: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: "#FEE2E2", gap: 10, backgroundColor: "#FFF" },
    logoutText: { color: "#E53935", fontWeight: "700", fontSize: 16 },
});