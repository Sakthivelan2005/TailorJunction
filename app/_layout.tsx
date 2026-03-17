// app/_layout.tsx

import NetworkMonitor from "@/components/NetworkMonitor";
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
import { Text, TextInput } from "react-native"; // Imported Text & TextInput
import "react-native-reanimated";

// This forces all Text and TextInputs to ignore the phone's accessibility font size,
// preventing your UI from exploding on phones with "Huge" font settings.
interface TextWithDefaultProps extends Text {
  defaultProps?: { allowFontScaling?: boolean };
}
interface TextInputWithDefaultProps extends TextInput {
  defaultProps?: { allowFontScaling?: boolean };
}

// Disable scaling for <Text>
(Text as unknown as TextWithDefaultProps).defaultProps =
  (Text as unknown as TextWithDefaultProps).defaultProps || {};
(Text as unknown as TextWithDefaultProps).defaultProps!.allowFontScaling =
  false;

// Disable scaling for <TextInput>
(TextInput as unknown as TextInputWithDefaultProps).defaultProps =
  (TextInput as unknown as TextInputWithDefaultProps).defaultProps || {};
(
  TextInput as unknown as TextInputWithDefaultProps
).defaultProps!.allowFontScaling = false;

export const unstable_settings = {
  anchor: "(tabs)",
};

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
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(tailor)" />
        </Stack>
        <NetworkMonitor />

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
