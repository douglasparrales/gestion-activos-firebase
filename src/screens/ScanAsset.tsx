import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import { StackNavigationProp } from "@react-navigation/stack";

import { Asset } from "../types/Asset";
import { addAsset } from "../api/assets";



// 🔹 Tipos para navegación
type RootStackParamList = {
    AddAsset: { assetId?: string };
    ScanAsset: undefined;
};

type ScanAssetScreenNavigationProp = StackNavigationProp<RootStackParamList, "ScanAsset">;

type Props = {
    navigation: ScanAssetScreenNavigationProp;
};

export default function ScanAsset({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);



    const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
        setScanned(true);
        console.log("QR escaneado:", data);

        // Limpia el valor escaneado para usarlo como ID válido en Firebase
        const idLimpio = data
            .replace(/[^a-zA-Z0-9_-]/g, "_") // solo letras, números, guiones o guiones bajos
            .substring(0, 50); // límite de 50 caracteres por seguridad

        const nuevoActivo: Asset = {
            id: idLimpio,
            nombre: "Activo nuevo",
            categoria: "General",
            estado: "Disponible",
            ubicacion: "Sin asignar",
            fechaAdquisicion: new Date().toISOString().split("T")[0],
        };



        try {
            await addAsset(nuevoActivo);
            console.log("Activo guardado correctamente ✅");

            // Navega a AddAsset con el id escaneado
            navigation.navigate("AddAsset", { assetId: data });
        } catch (error) {
            console.error("❌ Error al guardar activo:", error);
        }
    };


    if (!permission) {
        return <Text>Solicitando permiso de cámara...</Text>;
    }

    if (!permission.granted) {
        return <Text>No se concedió acceso a la cámara.</Text>;
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            {scanned && <Text style={styles.scanText}>QR Escaneado ✅</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scanText: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "#00000088",
        color: "white",
        padding: 10,
        borderRadius: 8,
    },
});
