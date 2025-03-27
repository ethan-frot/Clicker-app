import React, {useState, useEffect} from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    TextInput,
} from "react-native";
import {router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    colors,
    spacing,
    typography,
    globalStyles,
} from "../../theme/theme.config";

export default function HomePage() {
    const [username, setUsername] = useState("");

    useEffect(() => {
        // Charger le pseudo s'il existe déjà
        const loadUsername = async () => {
            try {
                const savedUsername = await AsyncStorage.getItem("username");
                if (savedUsername) {
                    setUsername(savedUsername);
                }
            } catch (error) {
                console.error("Erreur lors du chargement du pseudo:", error);
            }
        };
        loadUsername();
    }, []);

    const selectTeam = async (team: "blue" | "red") => {
        if (!username.trim()) {
            alert("Veuillez entrer un pseudo");
            return;
        }

        try {
            await AsyncStorage.setItem("username", username);
            await AsyncStorage.setItem("selectedTeam", team);
            router.push("/clicker");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
        }
    };

    return (
        <View style={[globalStyles.container]}>
            <View style={styles.content}>
                <Text style={[globalStyles.text, styles.title]}>
                    Bienvenue au jeu !
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Entrez votre pseudo"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="#666"
                />

                <Text style={[globalStyles.text, styles.subtitle]}>
                    Choisissez votre équipe
                </Text>

                <TouchableOpacity
                    style={[styles.button, styles.blueButton]}
                    onPress={() => selectTeam("blue")}
                >
                    <Text style={[globalStyles.text, styles.buttonText]}>
                        Équipe Bleue
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.redButton]}
                    onPress={() => selectTeam("red")}
                >
                    <Text style={[globalStyles.text, styles.buttonText]}>
                        Équipe Rouge
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.lg,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.xl,
    },
    button: {
        width: 250,
        height: 70,
        borderRadius: spacing.xl,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: spacing.sm,
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
    },
    blueButton: {
        backgroundColor: colors.secondary,
    },
    redButton: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        ...typography.h2,
    },
    input: {
        width: 250,
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xl,
        color: colors.text,
        backgroundColor: colors.background,
        fontSize: 16,
    },
    subtitle: {
        ...typography.h2,
        marginBottom: spacing.lg,
    },
});
