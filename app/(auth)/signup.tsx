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

const SignUpScreen = () => {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    phoneNumber,
    resetAuth,
  } = useAuth();

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors["light"];

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (validateForm()) {
      // Simulate account creation - store in frontend state
      setIsRegistered(true);
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
        }}
      >
        <View style={{ alignItems: "center" }}>
          <ThemedText style={{ fontSize: 48, marginBottom: 16 }}>✅</ThemedText>
          <ThemedText style={{ textAlign: "center", marginBottom: 12 }}>
            Account Created!
          </ThemedText>
          <ThemedText style={{ textAlign: "center", marginBottom: 30 }}>
            Welcome to MeTime, {fullName}!
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.navigate("/")}
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={{ flex: 1, padding: 20 }}>
          {/* Full Name */}
          <ThemedText style={{ marginBottom: 8 }}>Full Name</ThemedText>
          <TextInput
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: errors.name
                ? colors.tabIconSelected
                : colors.tabIconDefault,
              borderRadius: 8,
              backgroundColor: colors.background,
              color: colors.text,
              marginBottom: 4,
            }}
            placeholderTextColor={colors.tint}
          />
          {errors.name && (
            <ThemedText style={{ marginBottom: 16 }}>{errors.name}</ThemedText>
          )}
          {!errors.name && <View style={{ marginBottom: 16 }} />}

          {/* Email */}
          <ThemedText style={{ marginBottom: 8 }}>Email</ThemedText>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: errors.email
                ? colors.tabIconSelected
                : colors.tabIconDefault,
              borderRadius: 8,
              backgroundColor: colors.background,
              color: colors.text,
              marginBottom: 4,
            }}
            placeholderTextColor={colors.tint}
          />
          {errors.email && (
            <ThemedText style={{ marginBottom: 16 }}>{errors.email}</ThemedText>
          )}
          {!errors.email && <View style={{ marginBottom: 16 }} />}

          {/* Password */}
          <ThemedText style={{ marginBottom: 8 }}>Password</ThemedText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: errors.password
                ? colors.tabIconSelected
                : colors.tabIconDefault,
              borderRadius: 8,
              backgroundColor: colors.background,
              paddingHorizontal: 12,
              marginBottom: 4,
            }}
          >
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{
                flex: 1,
                paddingVertical: 10,
                color: colors.text,
              }}
              placeholderTextColor={colors.tint}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <ThemedText style={{ fontSize: 16 }}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </ThemedText>
            </TouchableOpacity>
          </View>
          {errors.password && (
            <ThemedText style={{ marginBottom: 16 }}>
              {errors.password}
            </ThemedText>
          )}
          {!errors.password && <View style={{ marginBottom: 16 }} />}

          {/* Phone Number Display */}
          <ThemedText style={{ marginBottom: 8 }}>Phone Number</ThemedText>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.tabIconDefault,
              borderRadius: 8,
              backgroundColor: colors.background,
              marginBottom: 24,
            }}
          >
            <ThemedText>
              {"+91"} {phoneNumber}
            </ThemedText>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            style={{
              backgroundColor: colors.tabIconSelected,
              paddingVertical: 14,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: "#FFFFFF",
              }}
            >
              Register
            </ThemedText>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;
