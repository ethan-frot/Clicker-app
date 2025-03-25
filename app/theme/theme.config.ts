import { StyleSheet, TextStyle, ViewStyle } from "react-native";

export const colors = {
  primary: "#FF6B6B",
  secondary: "#4ECDC4",
  background: "#1A1A1A",
  surface: "#2D2D2D",
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  border: "#404040",
  success: "#4CAF50",
  error: "#FF5252",
  warning: "#FFC107",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: "700",
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: "600",
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: "400",
  } as TextStyle,
  caption: {
    fontSize: 14,
    fontWeight: "400",
  } as TextStyle,
});

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: spacing.xl,
  } as ViewStyle,
  surface: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.sm,
  } as ViewStyle,
  text: {
    color: colors.text,
  } as TextStyle,
  textSecondary: {
    color: colors.textSecondary,
  } as TextStyle,
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  } as ViewStyle,
});
