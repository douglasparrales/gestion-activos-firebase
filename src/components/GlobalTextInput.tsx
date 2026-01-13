import React from "react";
import { TextInput, StyleSheet, TextInputProps, View, Text } from "react-native";

export default function GlobalTextInput({ label, style, ...props }: TextInputProps & { label?: string }) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                {...props}
                placeholderTextColor="#64748B"
                style={[styles.input, style]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 4,
    },
    input: {
        backgroundColor: "#F1F5F9",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#1E293B",   // TEXTO OSCURO SIEMPRE VISIBLE
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
});
