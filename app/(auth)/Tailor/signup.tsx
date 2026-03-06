// app/(tailor)/signup.tsx

import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PersonalDetails from "./PersonalDetails";
import { ShopSpecialization } from "./ShopSpecialization";

export default function TailorSignup() {
  const [currentScreen, setCurrentScreen] = useState<"personal" | "shop">(
    "personal",
  );
  const { colors } = useTheme();

  const { setRole, completeSignup, completeTailorDetails } = useAuth();
  useEffect(() => {
    setRole("tailor");
  }, [setRole]);

  const handlePersonalNext = async () => {
    try {
      await completeSignup();
      setCurrentScreen("shop");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  const handleSignupComplete = async () => {
    try {
      await completeTailorDetails();
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
    <SafeAreaView style={styles.container}>
      <Header title="Sign Up" onBackPress={() => router.push("/")} />

      <View style={styles.content}>
        {currentScreen === "personal" ? (
          <PersonalDetails onNext={handlePersonalNext} />
        ) : (
          <ShopSpecialization onNext={handleSignupComplete} />
        )}
      </View>
    </SafeAreaView>
  );
}
