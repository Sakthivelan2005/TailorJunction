import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider as CustomThemeProvider } from "@/context/ThemeContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ToastProvider } from "@/hooks/useToast";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CustomThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(customer)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </CustomThemeProvider>
  );
}
