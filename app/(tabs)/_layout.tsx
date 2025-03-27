import {Tabs} from "expo-router";
import React from "react";
import {FontAwesome} from "@expo/vector-icons";
import {colors} from "../../theme/theme.config";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({color, size}: { color: string; size: number }) => (
                        <FontAwesome name="home" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="clicker"
                options={{
                    title: "Clicker",
                    tabBarIcon: ({color, size}: { color: string; size: number }) => (
                        <FontAwesome name="hand-pointer-o" size={size} color={color}/>
                    ),
                }}
            />
        </Tabs>
    );
}
