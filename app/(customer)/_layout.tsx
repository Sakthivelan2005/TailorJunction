import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // [Official Expo Icons](https://docs.expo.dev)
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function CustomerLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor={colorScheme === "dark" ? "#001F3F" : "#fff"}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: themeColors.tint,
          tabBarInactiveTintColor: themeColors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: "#001F3F",
            borderTopWidth: 0,
            elevation: 10,
            height: 70,
            paddingBottom: 10,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="home" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="tailors"
          options={{
            title: "Tailors",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="content-cut" size={28} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="tracking"
          options={{
            title: "Orders",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="truck-delivery" size={28} color={color} />
            ),
          }}
        />

        {/* Hiding internal process screens from the bottom tab bar */}
        <Tabs.Screen name="dress" options={{ href: null }} />
        <Tabs.Screen name="measurements" options={{ href: null }} />
        <Tabs.Screen name="order-summary" options={{ href: null }} />
        <Tabs.Screen name="payment" options={{ href: null }} />
        <Tabs.Screen name="review" options={{ href: null }} />
      </Tabs>
    </>
  );
}
