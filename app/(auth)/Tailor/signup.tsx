// app/(tailor)/signup.tsx

import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import PersonalDetails from "./PersonalDetails";
import { ShopSpecialization } from "./ShopSpecialization";

export default function TailorSignup() {
  const { setRole, completeSignup } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<"personal" | "shop">(
    "personal",
  );
  const { colors } = useTheme();

  useEffect(() => {
    setRole("tailor");
  }, [setRole]);

  const handlePersonalNext = () => {
    setCurrentScreen("shop");
  };

  const handleSignupComplete = async () => {
    try {
      await completeSignup();
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary || "#fff",
    },
    content: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Header title="Sign Up" onBackPress={() => router.back()} />

      <View style={styles.content}>
        {currentScreen === "personal" ? (
          <PersonalDetails onNext={handlePersonalNext} />
        ) : (
          <ShopSpecialization onNext={handleSignupComplete} />
        )}
      </View>
    </View>
  );
}
