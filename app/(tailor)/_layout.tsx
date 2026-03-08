import UrgentOrderModal from "@/components/UrgentOrderModal";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function TailorLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const isButtonNavAndroid = Platform.OS === "android" && insets.bottom > 0;
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar
          style={colorScheme === "dark" ? "light" : "dark"}
          backgroundColor={colorScheme === "dark" ? "#001F3F" : "#fff"}
        />

        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: "#8E8E93",
            tabBarStyle: styles.tabBar,
            tabBarItemStyle: styles.tabBarItem,
            headerShown: false,
            tabBarShowLabel: true,
          }}
          safeAreaInsets={{
            bottom: isButtonNavAndroid ? insets.bottom : undefined,
          }}
        >
          <Tabs.Screen
            name="Home"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="home-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="account-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Orders"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="truck-delivery-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Customers"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Settings"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={26}
                  color={color}
                />
              ),
            }}
          />

          <Tabs.Screen
            name="Chat"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="Measurements"
            options={{
              href: null,
              headerShown: false,
            }}
          />
        </Tabs>
      </SafeAreaView>

      <UrgentOrderModal />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "relative",
    bottom: 0,
    left: 16,
    right: 16,
    height: 60,
    backgroundColor: "white",
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: Platform.OS === "android" ? 8 : 12,
    alignItems: "center",
  },
  tabBarItem: {
    marginHorizontal: 4,
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
});
