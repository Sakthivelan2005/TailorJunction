import Header from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CustomerLoginScreen = () => {
  const labelColor = "#000000";
  const { colors } = useTheme();
  const { setUserId, setRole, setCurrentStep, API_URL } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    server?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const trimmedId = identifier.trim();
    const isPhone = /^\d{10}$/.test(trimmedId);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedId);

    if (!trimmedId) {
      newErrors.identifier = "Please enter your Mobile Number or Email.";
    } else if (!isPhone && !isEmail) {
      newErrors.identifier =
        "Please enter a valid 10-digit phone number or email.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearLocalError = (field: keyof typeof errors) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password,
          role: "customer",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials");
      }

      setUserId(data.userId);
      setRole(data.role);
      setCurrentStep("home");

      if (data.success) {
        router.replace("/(customer)/Home");
      } else {
        throw new Error("This login is for customers only.");
      }
    } catch (err: any) {
      setErrors({ server: err.message || "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Header title="Customer Login" onBackPress={() => router.push("/")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        bounces={false}
      >
        <ThemedView
          style={{
            flex: 1,
            padding: 20,
            backgroundColor: colors.primary,
            justifyContent: "center",
          }}
        >
          {errors.server && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: "#EF4444",
                marginBottom: 16,
                marginHorizontal: 15,
              }}
            >
              <ThemedText style={{ color: "#DC2626", fontWeight: "500" }}>
                {errors.server}
              </ThemedText>
            </View>
          )}

          <ThemedView
            style={{
              padding: 20,
              backgroundColor: "rgba(255, 255, 255, 0.79)",
              borderRadius: 26,
              margin: 15,
            }}
          >
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
                color: labelColor,
              }}
            >
              Welcome Back
            </ThemedText>

            {/* Email / Mobile Input */}
            <ThemedText style={{ marginBottom: 8, color: labelColor }}>
              Mobile / Email ID
            </ThemedText>
            <TextInput
              placeholder="Enter your Mobile Number or Email ID"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                clearLocalError("identifier");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: errors.identifier ? "#EF4444" : "#494545",
                borderRadius: 8,
                backgroundColor: colors.background,
                marginBottom: 4,
                color: colors.text,
              }}
              placeholderTextColor={colors.primary}
            />
            {errors.identifier && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.identifier}
              </ThemedText>
            )}
            {!errors.identifier && <View style={{ marginBottom: 16 }} />}

            {/* Password Input */}
            <ThemedText style={{ marginBottom: 8, color: labelColor }}>
              Password
            </ThemedText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: errors.password ? "#EF4444" : "#494545",
                borderRadius: 8,
                backgroundColor: colors.background,
                paddingHorizontal: 12,
                marginBottom: 4,
              }}
            >
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearLocalError("password");
                }}
                secureTextEntry={!showPassword}
                style={{ flex: 1, paddingVertical: 10, color: labelColor }}
                placeholderTextColor={colors.primary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <ThemedText style={{ fontSize: 16, color: labelColor }}>
                  {showPassword ? "Show" : "Hide"}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.password}
              </ThemedText>
            )}
            {!errors.password && <View style={{ marginBottom: 16 }} />}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? "#9CA3AF" : "#0a7ea4",
                paddingVertical: 14,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  Log in
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: colors.text }}>
                Don't have an account?
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/customer/signup")}
              >
                <ThemedText style={{ fontWeight: "600", color: colors.text }}>
                  Sign up
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomerLoginScreen;
