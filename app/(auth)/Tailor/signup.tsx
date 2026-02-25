// app/(tailor)/signup/index.tsx
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import PersonalDetails from "./PersonalDetails";
import { ShopSpecialization } from "./ShopSpecialization";
import TailorHeader from "./TailorHeader";

export default function TailorSignup() {
  const { setRole, completeSignup } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<"personal" | "shop">(
    "personal",
  );

  useEffect(() => {
    setRole("tailor");
  }, [setRole]);

  const handlePersonalNext = (data: any) => {
    setCurrentScreen("shop");
  };

  const handleSignupComplete = async () => {
    try {
      await completeSignup();
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <TailorHeader title="Tailors Sign Up" />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
});
