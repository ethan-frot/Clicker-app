import React, {useState, useEffect} from "react";
import {View, StyleSheet, TouchableOpacity, Text} from "react-native";
import {
    colors,
    spacing,
    typography,
    globalStyles,
} from "../theme/theme.config";
import {FontAwesome} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useNavigation} from "expo-router";
import {db} from "../utils/database";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";

export default function ClickerPage() {
    const [score, setScore] = useState(0);
    const [team, setTeam] = useState<"blue" | "red" | null>(null);
    const [blueScore, setBlueScore] = useState(0);
    const [redScore, setRedScore] = useState(0);
    const navigation = useNavigation();

    const loadTeam = async () => {
        try {
            const selectedTeam = await AsyncStorage.getItem("selectedTeam");
            if (selectedTeam === "blue" || selectedTeam === "red") {
                setTeam(selectedTeam);
            }
        } catch (error) {
            console.error("Erreur lors du chargement de l'équipe:", error);
        }
    };

    useEffect(() => {
        loadTeam();

        // Ajouter un listener pour recharger l'équipe quand on revient sur cette page
        const unsubscribe = navigation.addListener("focus", () => {
            loadTeam();
        });

        // Nettoyer le listener quand le composant est démonté
        return () => {
            unsubscribe();
        };
    }, [navigation]);

    // Écouter les changements en temps réel
    useEffect(() => {
        let unsubscribeFirestore: (() => void) | undefined;

        const setupFirestoreListener = async () => {
            try {
                const scoresRef = collection(db, "interactions");

                // Écouter les clics de l'équipe bleue
                const blueQuery = query(scoresRef, where("team", "==", "blue"));
                onSnapshot(blueQuery, (querySnapshot) => {
                    let totalScore = 0;
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        totalScore += data.clicks || 0;
                    });
                    setBlueScore(totalScore);
                });

                // Écouter les clics de l'équipe rouge
                const redQuery = query(scoresRef, where("team", "==", "red"));
                onSnapshot(redQuery, (querySnapshot) => {
                    let totalScore = 0;
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        totalScore += data.clicks || 0;
                    });
                    setRedScore(totalScore);
                });

                // Écouter les clics de l'équipe sélectionnée
                if (team) {
                    const teamQuery = query(scoresRef, where("team", "==", team));
                    unsubscribeFirestore = onSnapshot(teamQuery, (querySnapshot) => {
                        let totalScore = 0;
                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            totalScore += data.clicks || 0;
                        });
                        setScore(totalScore);
                    });
                }
            } catch (error) {
                console.error("Erreur lors du chargement du score:", error);
            }
        };

        setupFirestoreListener();

        return () => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, [team]);

    const calculatePercentage = () => {
        const total = blueScore + redScore;
        if (total === 0) return {blue: 50, red: 50};
        return {
            blue: (blueScore / total) * 100,
            red: (redScore / total) * 100,
        };
    };

    const handleClick = async () => {
        if (!team) return;

        try {
            // Ajouter une nouvelle interaction avec un clic
            const interactionsRef = collection(db, "interactions");
            await addDoc(interactionsRef, {
                team: team,
                clicks: 1,
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du clic:", error);
        }
    };

    const getTeamColor = () => {
        return team === "blue" ? colors.secondary : colors.primary;
    };

    const getTeamName = () => {
        return team === "blue" ? "Bleue" : "Rouge";
    };

    const handleChangeTeam = async () => {
        await AsyncStorage.removeItem("selectedTeam");
        router.push("/");
    };

    if (!team) {
        return (
            <View style={[globalStyles.container]}>
                <View style={styles.content}>
                    <Text style={[globalStyles.text, styles.errorText]}>
                        Veuillez d'abord sélectionner une équipe
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[globalStyles.container]}>
            <View style={styles.header}>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.secondary,
                                    width: `${calculatePercentage().blue}%`,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: `${calculatePercentage().red}%`,
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={[globalStyles.text, styles.progressText]}>
                            {Math.round(calculatePercentage().blue)}% Bleue
                        </Text>
                        <Text style={[globalStyles.text, styles.progressText]}>
                            {Math.round(calculatePercentage().red)}% Rouge
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.content}>
                <View style={styles.scoreContainer}>
                    <Text style={[globalStyles.text, styles.scoreText]}>
                        Score: {score}
                    </Text>
                    <FontAwesome name="trophy" size={32} color={colors.warning}/>
                </View>
                <Text style={[globalStyles.text, styles.teamText]}>
                    Équipe {getTeamName()}
                </Text>
                <TouchableOpacity
                    style={[styles.clickButton, {backgroundColor: getTeamColor()}]}
                    onPress={handleClick}
                    activeOpacity={0.7}
                >
                    <FontAwesome name="hand-pointer-o" size={50} color={colors.text}/>
                    <Text style={[globalStyles.text, styles.buttonText]}>Cliquez!</Text>
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
        gap: spacing.xl,
    },
    header: {
        justifyContent: "center",
        alignItems: "center",
        paddingTop: spacing.xl,
    },
    changeTeamButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: spacing.md,
    },
    changeTeamText: {
        ...typography.body,
    },
    scoreContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    scoreText: {
        ...typography.h1,
    },
    teamText: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    clickButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    buttonText: {
        ...typography.h2,
        marginTop: spacing.sm,
    },
    errorText: {
        ...typography.h2,
        color: colors.error,
    },
    progressContainer: {
        width: "80%",
        alignItems: "center",
        gap: spacing.sm,
    },
    progressBar: {
        width: "100%",
        height: 20,
        backgroundColor: colors.surface,
        borderRadius: 10,
        overflow: "hidden",
        flexDirection: "row",
    },
    progressFill: {
        height: "100%",
    },
    progressLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    progressText: {
        ...typography.body,
    },
});
