// hooks/useThemedIcons.ts
import { Colors } from "@/constants/theme";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { useColorScheme } from "react-native";

export const useThemedIcons = () => {
  const colorScheme = useColorScheme();
  const colors = Colors["light"];

  return {
    back: <EvilIcons name="arrow-left" size={50} color={colors.text} />,
    location: (
      <Ionicons name="location-outline" size={25} color={colors.text} />
    ),
    home: <Ionicons name="home-outline" size={28} color={colors.text} />,
    profile: <Ionicons name="person-outline" size={28} color={colors.text} />,
    settings: (
      <Ionicons name="settings-outline" size={28} color={colors.text} />
    ),
    shop: <AntDesign name="shop" size={28} color={colors.text} />,
  };
};
