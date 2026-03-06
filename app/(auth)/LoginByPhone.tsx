// app/(auth)/login.tsx - ✅ NO API CALLS - LOCAL PHONE CHECK
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginByPhone = () => {
  const {
    phoneNumber,
    setPhoneNumber,
    sendVerificationCode,
    checkPhoneExists,
    role,
  } = useAuth();

  const [errors, setErrors] = useState<{ phone?: string }>({});
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneExists, setPhoneExists] = useState<boolean | null>(null);
  const { colors } = useTheme();

  // ✅ CHECK PHONE WHEN IT CHANGES (LOCAL - NO API)
  useEffect(() => {
    const checkPhone = () => {
      const cleanPhone = phoneNumber.replace(/\D/g, "");

      if (cleanPhone.length === 10) {
        setCheckingPhone(true);

        // ✅ LOCAL CHECK - No API call
        setTimeout(async () => {
          const exists = await checkPhoneExists(phoneNumber);
          console.log("🔍 LOCAL CHECK:", cleanPhone, "exists:", exists);
          setPhoneExists(exists);
          setCheckingPhone(false);
        }, 800); // Simulate network delay
      } else {
        setPhoneExists(null);
      }
    };

    const timeoutId = setTimeout(checkPhone, 500);
    return () => clearTimeout(timeoutId);
  }, [phoneNumber]);

  const validatePhone = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    console.log("cleanPhone:", cleanPhone.slice(0, 10));
    if (cleanPhone.length !== 10) {
      setErrors({ phone: "Enter valid 10-digit phone number" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleContinue = async () => {
    if (!validatePhone()) return;

    if (checkingPhone) return;

    if (phoneExists === null) {
      setErrors({ phone: "Checking phone number..." });
      return;
    }

    if (phoneExists === true) {
      // ✅ EXISTING USER → SEND OTP
      console.log("✅ Account found! Sending OTP...");
      await sendVerificationCode(phoneNumber);
      router.push("/(auth)/Verification");
    } else {
      // ✅ NEW USER → SIGNUP
      setErrors({ phone: "No account found. Please sign up first!" });
      // Auto-redirect to signup after 2s
      setTimeout(() => {
        const path =
          role === "tailor" ? "/(tailor)/Home" : "/(customer)/status";
        router.replace(path as any);
      }, 1000 * 60);
    }
  };

  const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 5) return cleaned;
    if (cleaned.length <= 10)
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <ThemedView
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "space-between",
            backgroundColor: colors.text,
          }}
        >
          {/* Header */}
          <View style={{ marginTop: 40 }}>
            <ThemedText
              style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}
            >
              Welcome Back
            </ThemedText>
            <ThemedText>Enter your phone number to continue</ThemedText>

            {/* Phone Number Input */}
            <ThemedText style={{ marginTop: 32, marginBottom: 8 }}>
              Phone Number (+91)
            </ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.secondary,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                }}
              >
                <ThemedText style={{ fontWeight: "600" }}>+91</ThemedText>
              </View>
              <TextInput
                placeholder="73054 18555"
                value={formatPhoneInput(phoneNumber)}
                onChangeText={(text) => {
                  const cleanNumber = text.replace(/\D/g, "");
                  setPhoneNumber(cleanNumber.slice(0, 10));
                }}
                keyboardType="phone-pad"
                maxLength={14}
                editable={!checkingPhone}
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: errors.phone
                    ? "#EF4444"
                    : checkingPhone
                      ? "#F59E0B"
                      : colors.secondary,
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  fontSize: 16,
                }}
                placeholderTextColor={colors.text}
              />
            </View>

            {/* Status Messages */}
            {checkingPhone && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color="#F59E0B" />
                <ThemedText style={{ color: "#F59E0B" }}>
                  Checking phone number...
                </ThemedText>
              </View>
            )}

            {phoneExists === true && (
              <ThemedText
                style={{ marginTop: 8, color: "#10B981", fontWeight: "500" }}
              >
                ✅ Account found! Send OTP to login.
              </ThemedText>
            )}

            {errors.phone && (
              <ThemedText style={{ marginTop: 8, color: "#EF4444" }}>
                {errors.phone}
              </ThemedText>
            )}
          </View>

          {/* Buttons */}
          <View style={{ marginBottom: 30 }}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={checkingPhone}
              style={{
                backgroundColor: checkingPhone ? "#D1D5DB" : colors.background,
                paddingVertical: 16,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              {checkingPhone ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : phoneExists === true ? (
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Send OTP
                </ThemedText>
              ) : (
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Continue
                </ThemedText>
              )}
            </TouchableOpacity>

            <View
              style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
            >
              <ThemedText>New user?</ThemedText>
              <TouchableOpacity onPress={() => router.back()}>
                <ThemedText
                  style={{ fontWeight: "600", color: colors.primary }}
                >
                  Create Account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginByPhone;
