import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  colors,
  spacing,
  typography,
  globalStyles,
} from "../theme/theme.config";

export default function HomePage() {
  const selectTeam = async (team: "blue" | "red") => {
    try {
      await AsyncStorage.setItem("selectedTeam", team);
      router.push("/clicker");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'équipe:", error);
    }
  };

  return (
    <View style={[globalStyles.container]}>
      <View style={styles.content}>
        <Text style={[globalStyles.text, styles.title]}>
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
});
