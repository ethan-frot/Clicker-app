import React from "react";
import {Stack} from "expo-router";
import {colors} from "../theme/theme.config";
import {StatusBar} from "expo-status-bar";

export default function RootLayout() {
    return (
        <>
            <StatusBar style="light" backgroundColor={colors.background}/>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTintColor: colors.text,
                }}
            >
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
            </Stack>
        </>
    );
}
