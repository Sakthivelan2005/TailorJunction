import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const LoginScreen = () => {
  const { phoneNumber, setPhoneNumber, setCurrentStep, sendVerificationCode } =
    useAuth();

  const [errors, setErrors] = useState<{ phone?: string }>({});
  const colorScheme = useColorScheme();
  const colors = Colors["light"];

  const validatePhone = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrors({ phone: "Please enter a valid phone number" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (validatePhone()) {
      sendVerificationCode("+91" + phoneNumber);
      setCurrentStep("verification");
      router.navigate("/(auth)/Verification");
    }
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const formatted = cleaned.replace(/(\d{5})(\d{5})/, "$1 $2 $3");
    return formatted.slice(0, 11);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={{ flex: 1, padding: 20, justifyContent: "space-between" }}
        >
          {/* Header */}
          <View style={{ marginTop: 40 }}>
            <ThemedText style={{ marginBottom: 20 }}>
              Please confirm your country code and enter your phone number.
            </ThemedText>

            {/* Country Picker */}
            <ThemedText style={{ marginBottom: 8 }}>Country</ThemedText>

            {/* Phone Number Input */}
            <ThemedText style={{ marginTop: 20, marginBottom: 8 }}>
              Phone Number
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: colors.tabIconSelected,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  justifyContent: "center",
                }}
              >
                <ThemedText>{"+91"}</ThemedText>
              </View>
              <TextInput
                placeholder="00000-00000"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(formatPhoneInput(text))}
                keyboardType="phone-pad"
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: errors.phone
                    ? colors.tabIconSelected
                    : colors.tabIconDefault,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  fontSize: 14,
                }}
                placeholderTextColor={colors.tint}
              />
            </View>
            {errors.phone && (
              <ThemedText style={{ marginTop: 6 }}>{errors.phone}</ThemedText>
            )}
          </View>

          {/* Continue Button */}
          <View style={{ marginBottom: 30 }}>
            <TouchableOpacity
              onPress={handleContinue}
              style={{
                backgroundColor: colors.background,
                paddingVertical: 14,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <ThemedText style={{ textAlign: "center", fontWeight: "600" }}>
                Continue
              </ThemedText>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View
              style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
            >
              <ThemedText>Don't have an account?</ThemedText>
              <TouchableOpacity
                onPress={() => router.navigate("/(auth)/signup")}
              >
                <ThemedText style={{ fontWeight: "600" }}>Sign up</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
