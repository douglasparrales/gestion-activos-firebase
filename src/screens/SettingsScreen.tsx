import React, { useState } from "react";
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar 
} from "react-native";
import { useUser } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { AppText } from "../components/AppText";
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
            await setDoc(doc(db, "usuarios", cred.user.uid), { 
                name, 
                email, 
                role: "user", 
                createdAt: new Date() 
            });
            
            Alert.alert("Éxito", `Usuario ${name} creado con éxito.`);
            setName(""); setEmail(""); setPassword("");
        } catch (error: any) { 
            Alert.alert("Error", "No se pudo crear el usuario."); 
        } finally { setLoading(false); }
    };

    return (
        <View style={globalStyles.screen}>
            <StatusBar barStyle="dark-content" />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <AppText bold size={28} color={COLORS.primary}>Configuración</AppText>
                    <AppText color={COLORS.textSecondary}>Gestión de cuenta y sistema</AppText>
                </View>

                {/* 👤 SECCIÓN DE PERFIL */}
                <View style={globalStyles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle" size={22} color={COLORS.secondary} />
                        <AppText bold size={16} style={{ marginLeft: 8 }}>Mi Perfil</AppText>
                    </View>
                    
                    <View style={styles.profileInfo}>
                        <View style={styles.infoRow}>
                            <AppText bold size={10} color={COLORS.textSecondary} style={styles.label}>NOMBRE</AppText>
                            <AppText size={16} color={COLORS.textPrimary}>{user?.name}</AppText>
                        </View>
                        <View style={styles.infoRow}>
                            <AppText bold size={10} color={COLORS.textSecondary} style={styles.label}>CORREO ELECTRÓNICO</AppText>
                            <AppText size={16} color={COLORS.textPrimary}>{user?.email}</AppText>
                        </View>
                        <View style={styles.roleBadge}>
                            <AppText bold size={10} color={COLORS.secondary}>{user?.role?.toUpperCase()}</AppText>
                        </View>
                    </View>
                </View>

                {/* 👑 PANEL DE ADMINISTRADOR */}
                {user?.role === "admin" && (
                    <View style={{ marginTop: 10 }}>
                        <AppText bold size={12} color={COLORS.textSecondary} style={styles.groupLabel}>ADMINISTRACIÓN</AppText>
                        
                        <View style={globalStyles.card}>
                            <AppText bold size={14} color={COLORS.textPrimary} style={{ marginBottom: 15 }}>Catálogos Maestros</AppText>
                            <View style={styles.buttonGrid}>
                                <TouchableOpacity 
                                    style={styles.actionButton} 
                                    onPress={() => navigation.navigate("CategoryManager" as never)}
                                >
                                    <Ionicons name="pricetags-outline" size={24} color={COLORS.primary} />
                                    <AppText bold size={12}>Categorías</AppText>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.actionButton} 
                                    onPress={() => navigation.navigate("LocationManager" as never)}
                                >
                                    <Ionicons name="business-outline" size={24} color={COLORS.primary} />
                                    <AppText bold size={12}>Ubicaciones</AppText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={globalStyles.card}>
                            <AppText bold size={14} color={COLORS.textPrimary} style={{ marginBottom: 15 }}>Nuevo Usuario</AppText>
                            <GlobalTextInput 
                                label="Nombre"
                                placeholder="Ej. Juan Pérez"
                                value={name}
                                onChangeText={setName}
                            />
                            <GlobalTextInput 
                                label="Correo"
                                placeholder="correo@empresa.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <GlobalTextInput 
                                label="Contraseña"
                                placeholder="Min. 6 caracteres"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            <TouchableOpacity 
                                style={[styles.primaryButton, loading && { opacity: 0.7 }]} 
                                onPress={handleCreateUser} 
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                                    <>
                                        <Ionicons name="person-add-outline" size={20} color={COLORS.white} style={{marginRight: 8}} />
                                        <AppText bold color={COLORS.white}>Crear Cuenta</AppText>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* 🚪 CIERRE DE SESIÓN */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                    <AppText bold color={COLORS.error}>Cerrar Sesión</AppText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    header: { paddingVertical: 30 },
    groupLabel: { marginBottom: 10, marginLeft: 5, letterSpacing: 1.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    profileInfo: { gap: 15 },
    infoRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8 },
    label: { marginBottom: 2 },
    roleBadge: { 
        alignSelf: 'flex-start', 
        backgroundColor: '#E0F2FE', 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    buttonGrid: { flexDirection: 'row', gap: 12 },
    actionButton: { 
        flex: 1, 
        paddingVertical: 15, 
        borderRadius: 15, 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#F1F5F9'
    },
    primaryButton: { 
        backgroundColor: COLORS.secondary, 
        paddingVertical: 15, 
        borderRadius: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 10,
    },
    logoutButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        paddingVertical: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: COLORS.error, 
        gap: 10, 
        backgroundColor: COLORS.white,
        marginTop: 20
    },
});