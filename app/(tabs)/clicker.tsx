import React, {useState, useEffect, useRef} from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Animated,
    FlatList,
} from "react-native";
import {
    colors,
    spacing,
    typography,
    globalStyles,
} from "../../theme/theme.config";
import {FontAwesome} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router, useNavigation} from "expo-router";
import {db} from "../../utils/database";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    orderBy,
    limit,
} from "firebase/firestore";

// Interface pour les notifications de clic
interface ClickNotification {
    id: string;
    username: string;
    team: "blue" | "red";
    timestamp: Date;
    count: number;
    opacity: Animated.Value;
    isNew?: boolean;
}

// Interface pour les données utilisateur
interface UserData {
    username: string;
    team: "blue" | "red";
    totalClicks: number;
    lastClicked: Date;
    recentClicks: number;
    lastSeriesTimestamp: Date;
    autoClickersCount?: number;
}

export default function ClickerPage() {
    const [score, setScore] = useState(0);
    const [team, setTeam] = useState<"blue" | "red" | null>(null);
    const [blueScore, setBlueScore] = useState(0);
    const [redScore, setRedScore] = useState(0);
    const [username, setUsername] = useState("");
    const [notifications, setNotifications] = useState<ClickNotification[]>([]);
    const [recentClickers, setRecentClickers] = useState<{
        [key: string]: UserData;
    }>({});
    const autoClickerRef = useRef<NodeJS.Timeout | null>(null);
    const navigation = useNavigation();
    const [userTotalClicks, setUserTotalClicks] = useState(0);
    const [autoClickersCount, setAutoClickersCount] = useState(0);

    // Limiter le nombre de notifications à afficher
    const MAX_NOTIFICATIONS = 5;
    // Durée d'affichage d'une notification en ms
    const NOTIFICATION_DURATION = 5000;
    // Nombre de clics nécessaires pour débloquer l'autoclicker
    const AUTO_CLICKER_THRESHOLD = 100;
    // Intervalle entre les clics automatiques en ms
    const AUTO_CLICKER_INTERVAL = 1000;

    // Calcul du coût pour le prochain curseur
    const getNextAutoClickerCost = () => {
        return Math.floor(
            AUTO_CLICKER_THRESHOLD * Math.pow(1.5, autoClickersCount)
        );
    };

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
        // Charger le nom d'utilisateur
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

        const setupFirestoreListener = async () => {
            try {
                // Écouter les scores des deux équipes en temps réel
                const scoresRef = collection(db, "scores");

                // Écouter le document "blue" pour les scores de l'équipe bleue
                const blueDocRef = doc(scoresRef, "blue");
                const unsubscribeBlue = onSnapshot(blueDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const blueData = docSnapshot.data();
                        setBlueScore(blueData.total || 0);
                        if (team === "blue") {
                            setScore(blueData.total || 0);
                        }
                    } else {
                        // Créer le document s'il n'existe pas encore
                        setDoc(blueDocRef, {total: 0});
                        setBlueScore(0);
                        if (team === "blue") {
                            setScore(0);
                        }
                    }
                });

                // Écouter le document "red" pour les scores de l'équipe rouge
                const redDocRef = doc(scoresRef, "red");
                const unsubscribeRed = onSnapshot(redDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const redData = docSnapshot.data();
                        setRedScore(redData.total || 0);
                        if (team === "red") {
                            setScore(redData.total || 0);
                        }
                    } else {
                        // Créer le document s'il n'existe pas encore
                        setDoc(redDocRef, {total: 0});
                        setRedScore(0);
                        if (team === "red") {
                            setScore(0);
                        }
                    }
                });

                // Écouter les utilisateurs qui ont cliqué récemment
                const usersRef = collection(db, "users");
                const recentUsersQuery = query(
                    usersRef,
                    orderBy("lastClicked", "desc"),
                    limit(MAX_NOTIFICATIONS * 2)
                );

                const unsubscribeUsers = onSnapshot(
                    recentUsersQuery,
                    (querySnapshot) => {
                        const updatedClickers: { [key: string]: UserData } = {};
                        const newNotificationsMap: { [key: string]: ClickNotification } =
                            {};

                        // Créer une copie des notifications existantes
                        const existingNotifications = notifications.reduce((acc, notif) => {
                            acc[notif.id] = notif;
                            return acc;
                        }, {} as { [key: string]: ClickNotification });

                        // Traiter les documents d'utilisateurs
                        querySnapshot.forEach((doc) => {
                            const userData = doc.data();
                            const userId = doc.id;
                            const isCurrentUser =
                                userData.username === username && userData.team === team;

                            // Convertir le timestamp Firebase en Date si nécessaire
                            const lastClicked = userData.lastClicked?.toDate
                                ? userData.lastClicked.toDate()
                                : new Date(userData.lastClicked);

                            // Stocker les données de l'utilisateur
                            updatedClickers[userId] = {
                                username: userData.username,
                                team: userData.team,
                                totalClicks: userData.totalClicks || 0,
                                lastClicked: lastClicked,
                                recentClicks: userData.recentClicks || 0,
                                lastSeriesTimestamp: userData.lastSeriesTimestamp?.toDate
                                    ? userData.lastSeriesTimestamp.toDate()
                                    : new Date(userData.lastSeriesTimestamp || lastClicked),
                                autoClickersCount: userData.autoClickersCount || 0,
                            };

                            // Mettre à jour les informations de l'utilisateur actuel
                            if (isCurrentUser) {
                                setUserTotalClicks(userData.totalClicks || 0);
                                setAutoClickersCount(userData.autoClickersCount || 0);
                            }

                            // Vérifier si c'est un clic récent (moins de 30 secondes)
                            const currentTime = new Date().getTime();
                            const clickTime = lastClicked.getTime();
                            const isRecent = currentTime - clickTime < 30000;

                            if (isRecent) {
                                // Déterminer si c'est une nouvelle notification ou une mise à jour
                                const existing = existingNotifications[userId];
                                const opacity = existing
                                    ? existing.opacity
                                    : new Animated.Value(0);

                                // Créer ou mettre à jour la notification
                                newNotificationsMap[userId] = {
                                    id: userId,
                                    username: userData.username,
                                    team: userData.team,
                                    timestamp: lastClicked,
                                    count: userData.recentClicks || 0,
                                    opacity: opacity,
                                    isNew: !existing,
                                };
                            }
                        });

                        // Mettre à jour l'état des clickers récents
                        setRecentClickers(updatedClickers);

                        // Gérer les animations pour les notifications
                        Object.values(newNotificationsMap).forEach((notification) => {
                            if (notification.isNew) {
                                // Animation pour les nouvelles notifications
                                Animated.sequence([
                                    Animated.timing(notification.opacity, {
                                        toValue: 1,
                                        duration: 300,
                                        useNativeDriver: true,
                                    }),
                                    Animated.delay(NOTIFICATION_DURATION),
                                    Animated.timing(notification.opacity, {
                                        toValue: 0,
                                        duration: 300,
                                        useNativeDriver: true,
                                    }),
                                ]).start();
                            } else {
                                // Flash pour les notifications mises à jour
                                Animated.sequence([
                                    Animated.timing(notification.opacity, {
                                        toValue: 0.5,
                                        duration: 100,
                                        useNativeDriver: true,
                                    }),
                                    Animated.timing(notification.opacity, {
                                        toValue: 1,
                                        duration: 100,
                                        useNativeDriver: true,
                                    }),
                                    Animated.delay(NOTIFICATION_DURATION),
                                    Animated.timing(notification.opacity, {
                                        toValue: 0,
                                        duration: 300,
                                        useNativeDriver: true,
                                    }),
                                ]).start();
                            }
                        });

                        // Mettre à jour les notifications
                        const updatedNotifications = Object.values(newNotificationsMap)
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                            .slice(0, MAX_NOTIFICATIONS);

                        setNotifications(updatedNotifications);
                    }
                );

                return () => {
                    unsubscribeBlue();
                    unsubscribeRed();
                    unsubscribeUsers();
                };
            } catch (error) {
                console.error("Erreur lors du chargement du score:", error);
                return () => {
                };
            }
        };

        const unsubscribeFirestore = setupFirestoreListener();
        loadUsername();

        return () => {
            unsubscribeFirestore
                .then((unsubscribe) => {
                    if (unsubscribe) unsubscribe();
                })
                .catch((err) =>
                    console.error("Erreur lors du nettoyage des listeners:", err)
                );
        };
    }, [team, username, notifications]);

    // Gérer l'autoclicker
    useEffect(() => {
        // Nettoyer le timer existant s'il y en a un
        if (autoClickerRef.current) {
            clearInterval(autoClickerRef.current);
            autoClickerRef.current = null;
        }

        // Si l'utilisateur a des curseurs, démarrer le timer
        if (team && autoClickersCount > 0) {
            // Calcul d'intervalle basé sur le nombre d'autoclickers
            // Plus on a d'autoclickers, plus les clics sont fréquents
            const interval = Math.max(AUTO_CLICKER_INTERVAL / autoClickersCount, 100);

            autoClickerRef.current = setInterval(() => {
                handleClick();
            }, interval);
        }

        // Nettoyer lors du démontage du composant
        return () => {
            if (autoClickerRef.current) {
                clearInterval(autoClickerRef.current);
                autoClickerRef.current = null;
            }
        };
    }, [team, autoClickersCount]);

    const calculatePercentage = () => {
        const total = blueScore + redScore;
        if (total === 0) return {blue: 50, red: 50};
        return {
            blue: (blueScore / total) * 100,
            red: (redScore / total) * 100,
        };
    };

    const handleClick = async () => {
        if (!team || !username) return;

        try {
            // Mettre à jour le score total dans la collection "scores"
            const scoresRef = collection(db, "scores");
            const teamDocRef = doc(scoresRef, team);

            // Vérifier si le document existe déjà
            const teamDoc = await getDoc(teamDocRef);

            if (teamDoc.exists()) {
                // Incrémenter le score si le document existe déjà
                await updateDoc(teamDocRef, {
                    total: increment(1),
                });
            } else {
                // Créer le document avec un score initial de 1 s'il n'existe pas
                await setDoc(teamDocRef, {
                    total: 1,
                });
            }

            // Mise à jour ou création du document utilisateur
            const usersRef = collection(db, "users");
            const userId = `${username}_${team}`; // ID unique basé sur le nom d'utilisateur et l'équipe
            const userDocRef = doc(usersRef, userId);

            // Vérifier si l'utilisateur existe déjà
            const userDoc = await getDoc(userDocRef);
            const currentTime = new Date();

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const lastClicked = userData.lastClicked?.toDate
                    ? userData.lastClicked.toDate()
                    : new Date(userData.lastClicked);

                // Vérifier si le dernier clic date de plus de 30 secondes
                const timeDiff = currentTime.getTime() - lastClicked.getTime();

                if (timeDiff > 30000) {
                    // Si plus de 30 secondes, on commence une nouvelle série
                    await updateDoc(userDocRef, {
                        totalClicks: increment(1),
                        recentClicks: 1, // Réinitialiser le compteur de clics récents
                        lastClicked: currentTime,
                        lastSeriesTimestamp: currentTime, // Nouvelle série
                    });
                } else {
                    // Sinon, on incrémente la série de clics en cours
                    await updateDoc(userDocRef, {
                        totalClicks: increment(1),
                        recentClicks: increment(1),
                        lastClicked: currentTime,
                    });
                }
            } else {
                // Créer un nouveau document utilisateur
                await setDoc(userDocRef, {
                    username: username,
                    team: team,
                    totalClicks: 1,
                    recentClicks: 1,
                    lastClicked: currentTime,
                    lastSeriesTimestamp: currentTime,
                });
            }

            // Enregistrer l'interaction pour l'historique
            await addDoc(collection(db, "interactions"), {
                username: username,
                team: team,
                clicks: 1,
                timestamp: new Date(),
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

    // Composant pour afficher une notification de clic
    const renderNotification = ({item}: { item: ClickNotification }) => {
        const notificationColor =
            item.team === "blue" ? colors.secondary : colors.primary;

        return (
            <Animated.View
                style={[
                    styles.notification,
                    {
                        backgroundColor: notificationColor,
                        opacity: item.opacity,
                        transform: [
                            {
                                translateX: item.opacity.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.notificationText}>
                    <Text style={styles.notificationUsername}>{item.username}</Text>
                    {item.count > 1 ? (
                        <Text>
                            {" "}
                            a cliqué{" "}
                            <Text style={styles.notificationCount}>{item.count}x</Text>!
                        </Text>
                    ) : (
                        <Text> a cliqué!</Text>
                    )}
                </Text>
            </Animated.View>
        );
    };

    // Mettre à jour le composant de notification pour auto-supprimer après le délai
    useEffect(() => {
        // Nettoyer les notifications expirées toutes les 10 secondes
        const cleanupInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            setNotifications((prevNotifs) =>
                prevNotifs.filter(
                    (n) =>
                        currentTime - n.timestamp.getTime() < NOTIFICATION_DURATION + 1000
                )
            );
        }, 10000);

        return () => {
            clearInterval(cleanupInterval);
        };
    }, []);

    // Modifier la fonction buyAutoClicker pour s'assurer que l'utilisateur a assez de clics ou a déjà débloqué la fonctionnalité
    const buyAutoClicker = async () => {
        if (!team || !username) return;

        const nextCost = getNextAutoClickerCost();

        // Vérifier si l'utilisateur a suffisamment de clics pour acheter le curseur
        if (userTotalClicks < nextCost) {
            return; // Ne rien faire si l'utilisateur n'a pas assez de clics
        }

        // Vérifier si c'est le premier curseur et si l'utilisateur a débloqué la fonctionnalité
        if (autoClickersCount === 0 && userTotalClicks < AUTO_CLICKER_THRESHOLD) {
            return; // Ne rien faire si l'utilisateur n'a pas atteint le seuil pour débloquer
        }

        try {
            const usersRef = collection(db, "users");
            const userId = `${username}_${team}`;
            const userDocRef = doc(usersRef, userId);

            // Mettre à jour le nombre d'autoclickers et déduire le coût
            await updateDoc(userDocRef, {
                autoClickersCount: increment(1),
                totalClicks: increment(-nextCost), // Soustraire le coût du total de clics
            });

            // Mettre à jour l'état local
            setAutoClickersCount(autoClickersCount + 1);
            setUserTotalClicks(userTotalClicks - nextCost);
        } catch (error) {
            console.error("Erreur lors de l'achat d'un autoclicker:", error);
        }
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

                <View style={styles.notificationsContainer}>
                    <FlatList
                        data={notifications}
                        renderItem={renderNotification}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.notificationsList}
                    />
                </View>
            </View>
            <View style={styles.content}>
                <View style={styles.scoreContainer}>
                    <Text style={[globalStyles.text, styles.scoreText]}>
                        Score: {score}
                    </Text>
                    <FontAwesome name="trophy" size={32} color={colors.warning}/>
                </View>

                {/* Affichage du nombre total de clics de l'utilisateur */}
                <Text style={[globalStyles.text, styles.userClicksText]}>
                    Vos clics: {userTotalClicks}
                </Text>

                <Text style={[globalStyles.text, styles.teamText]}>
                    Équipe {getTeamName()}
                </Text>
                <View style={styles.clickButtonContainer}>
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

            {/* Compteur d'autoclickeurs */}
            {autoClickersCount > 0 && (
                <View style={styles.autoClickerCountContainer}>
                    <FontAwesome name="mouse-pointer" size={20} color={getTeamColor()}/>
                    <Text style={[globalStyles.text, styles.autoClickerCountText]}>
                        {autoClickersCount}
                    </Text>
                </View>
            )}
            {/* Autoclicker buttons section */}
            <View style={styles.upgradesContainer}>
                {/* Button to buy more autoclickers */}
                <TouchableOpacity
                    style={[
                        styles.autoClickerButton,
                        styles.buyAutoClickerButton,
                        {
                            backgroundColor:
                                userTotalClicks >= getNextAutoClickerCost()
                                    ? getTeamColor()
                                    : colors.surface,
                            opacity: userTotalClicks >= getNextAutoClickerCost() ? 1 : 0.7,
                            pointerEvents:
                                userTotalClicks >= getNextAutoClickerCost() ? "auto" : "none",
                        },
                    ]}
                    onPress={buyAutoClicker}
                >
                    <FontAwesome
                        name="plus-circle"
                        size={20}
                        color={
                            userTotalClicks >= getNextAutoClickerCost()
                                ? colors.text
                                : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            globalStyles.text,
                            userTotalClicks >= getNextAutoClickerCost()
                                ? styles.autoClickerText
                                : styles.autoClickerDisabledText,
                        ]}
                    >
                        Acheter curseur ({getNextAutoClickerCost()} clics)
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        gap: spacing.xl,
        paddingTop: spacing.xl * 4,
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
    clickButtonContainer: {
        position: "relative",
        width: 200,
        height: 200,
        justifyContent: "center",
        alignItems: "center",
    },
    clickButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.md,
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
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
    // Styles pour les notifications - repositionnées en haut à droite
    notificationsContainer: {
        position: "absolute",
        top: spacing.xl * 3,
        right: spacing.md,
        width: 200,
        maxHeight: 300,
        zIndex: 100,
    },
    notificationsList: {
        gap: spacing.sm,
    },
    notification: {
        padding: spacing.sm,
        borderRadius: spacing.md,
        marginBottom: spacing.sm,
        opacity: 0.9,
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
    },
    notificationText: {
        color: colors.text,
        fontSize: 14,
    },
    notificationUsername: {
        fontWeight: "bold",
    },
    notificationCount: {
        fontWeight: "bold",
        fontSize: 16,
    },
    userClicksText: {
        ...typography.body,
        fontWeight: "bold",
        marginBottom: spacing.sm,
    },

    // Styles pour les upgrades
    upgradesContainer: {
        position: "absolute",
        bottom: spacing.xl,
        left: spacing.md,
        zIndex: 100,
        gap: spacing.md,
    },
    autoClickerButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        borderRadius: spacing.md,
        gap: spacing.sm,
        boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
        minWidth: 220,
    },
    buyAutoClickerButton: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    autoClickerText: {
        ...typography.body,
        fontSize: 14,
    },
    autoClickerDisabledText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    autoClickerCountContainer: {
        position: "absolute",
        bottom: spacing.xl * 3,
        left: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        padding: spacing.sm,
        borderRadius: spacing.md,
    },
    autoClickerCountText: {
        ...typography.body,
        fontWeight: "bold",
    },
});
