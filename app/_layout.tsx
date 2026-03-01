// app/_layout.tsx

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ToastProvider, useToast } from "@/hooks/useToast";
import { registerForNotifications } from "@/utils/notificationConfig";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * ✅ This component runs INSIDE providers
 */
function AppStack() {
  const colorScheme = useColorScheme();
  const { error } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  useEffect(() => {
    registerForNotifications();
  }, []);

  return (
    <>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="home" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(tailor)" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppStack />
        </AuthProvider>
      </ToastProvider>
    </CustomThemeProvider>
  );
}
