// app/(auth)/signup.tsx -  EDITABLE PHONE INPUT + SERVER VALIDATION
import Header from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
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

const SignUpScreen = () => {
  const { colors } = useTheme();
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    phoneNumber,
    setPhoneNumber, //  NOW EDITABLE
    completeSignup,
    isLoading,
    error,
    resetAuth,
  } = useAuth();

  const { showToast } = useToast();

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string; //  Phone validation
    server?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  //  Sync auth error to local state
  useEffect(() => {
    if (submitAttempted && error) {
      setErrors((prev) => ({ ...prev, server: error }));
      showToast(error, "error");
    }
  }, [error, submitAttempted]);

  const clearLocalError = (field: keyof typeof errors) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  //  PHONE NUMBER VALIDATION (10 digits)
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length === 10;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.name = "Full name is required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      newErrors.email = "Valid email is required";
    }

    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    //  VALIDATE PHONE NUMBER
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digits
    const clean = text.replace(/\D/g, "");
    // Format as: 98765 43210
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
  };

  const handleSignUp = async () => {
    setSubmitAttempted(true);

    if (!validateForm()) {
      showToast("Please fix form errors", "warning");
      return;
    }

    setErrors({});

    try {
      showToast("Creating account...", "success");

      //  Sends phoneNumber to backend
      await completeSignup();

      showToast(` Welcome ${fullName}! Account created`, "success");
      setIsRegistered(true);
    } catch (err: any) {
      const errorMessage = err.message || "Signup failed";
      console.error("❌ Signup FAILED:", errorMessage);
      showToast(errorMessage, "error");
      setErrors({ server: errorMessage });
    }
  };

  const handleBackToLogin = () => {
    resetAuth();
    router.navigate("/(auth)/login");
  };

  if (isRegistered) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 48, marginBottom: 16 }}></ThemedText>
          <ThemedText
            style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}
          >
            Account Created!
          </ThemedText>
          <ThemedText style={{ textAlign: "center", marginBottom: 30 }}>
            Welcome to TailorJunction, {fullName}!
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.navigate("/(customer)/Home")}
            style={{
              backgroundColor: colors.secondary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
              Go to Home
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Header title="Sign Up" onBackPress={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={{ flex: 1, padding: 20, backgroundColor: colors.primary }}
        >
          {/* SERVER ERROR */}
          {errors.server && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 4,
                borderLeftColor: "#EF4444",
                marginBottom: 16,
              }}
            >
              <ThemedText style={{ color: "#DC2626", fontWeight: "500" }}>
                {errors.server}
              </ThemedText>
            </View>
          )}
          <ThemedView
            style={{
              flex: 1,
              padding: 20,
              backgroundColor: "rgba(255, 255, 255, 0.79)",
              borderRadius: 26,
              margin: 15,
            }}
          >
            {/* Full Name */}
            <ThemedText style={{ marginBottom: 8 }}>Full Name</ThemedText>
            <TextInput
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                clearLocalError("name");
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: errors.name ? "#EF4444" : "#494545",
                borderRadius: 8,
                backgroundColor: colors.background,
                marginBottom: 4,
              }}
              placeholderTextColor={colors.primary}
            />
            {errors.name && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.name}
              </ThemedText>
            )}
            {!errors.name && <View style={{ marginBottom: 16 }} />}

            {/*  EDITABLE PHONE NUMBER INPUT */}
            <ThemedText style={{ marginBottom: 8 }}>Phone Number</ThemedText>
            <TextInput
              placeholder="Enter 10-digit phone number"
              value={phoneNumber}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                setPhoneNumber(formatted);
                clearLocalError("phone");
              }}
              keyboardType="phone-pad"
              maxLength={14} // 5 + space + 5 = 11 + buffer
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: errors.phone ? "#EF4444" : "#494545",
                borderRadius: 8,
                backgroundColor: colors.background,
                marginBottom: 4,
              }}
              placeholderTextColor={colors.primary}
            />
            {errors.phone && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.phone}
              </ThemedText>
            )}
            {!errors.phone && <View style={{ marginBottom: 16 }} />}

            {/* Email */}
            <ThemedText style={{ marginBottom: 8 }}>Email</ThemedText>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearLocalError("email");
              }}
              keyboardType="email-address"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: errors.email ? "#EF4444" : "#494545",
                borderRadius: 8,
                backgroundColor: colors.background,
                color: colors.text,
                marginBottom: 4,
              }}
              placeholderTextColor={colors.primary}
            />
            {errors.email && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.email}
              </ThemedText>
            )}
            {!errors.email && <View style={{ marginBottom: 16 }} />}

            {/* Password */}
            <ThemedText style={{ marginBottom: 8 }}>Password</ThemedText>
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
                style={{ flex: 1, paddingVertical: 10, color: colors.text }}
                placeholderTextColor={colors.primary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <ThemedText style={{ fontSize: 16 }}>
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </ThemedText>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.password}
              </ThemedText>
            )}
            {!errors.password && <View style={{ marginBottom: 16 }} />}

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                  Register
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View
              style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
            >
              <ThemedText>Already have an account?</ThemedText>
              <TouchableOpacity onPress={handleBackToLogin}>
                <ThemedText style={{ fontWeight: "600" }}>Log in</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
