// app/(auth)/personalDetails.tsx - UPDATED VALIDATION + PROFESSIONAL MESSAGES

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

const PersonalDetails: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { colors } = useTheme();
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    phoneNumber,
    setPhoneNumber,
    otp,
    setOtp,
    sendVerificationCode,
    verifyOtp,
    isLoading,
    error,
    completeSignup,
    resetAuth,
  } = useAuth();

  const { showToast } = useToast();

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    server?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [showOtpInput, setShowOtpInput] = useState(false);

  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpVisible, setOtpVisible] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.name = "Please enter your full name.";
    } else if (fullName.trim().length < 3) {
      newErrors.name = "Full name must be at least 3 characters long.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (!phoneNumber) {
      newErrors.phone = "Mobile number is required.";
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (text: string): string => {
    const clean = text.replace(/\D/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
  };

  const handleSignUp = async () => {
    setSubmitAttempted(true);
    onNext();
    if (!validateForm()) {
      showToast("Please correct the highlighted fields.", "warning");
      return;
    }

    setErrors({});

    try {
      showToast("Creating your account. Please wait...", "success");

      await completeSignup();

      showToast(
        `Welcome ${fullName}. Your account has been created successfully.`,
        "success",
      );

      setIsRegistered(true);
    } catch (err: any) {
      const errorMessage =
        err.message || "Registration failed. Please try again.";

      console.error("Signup failed:", errorMessage);

      showToast(errorMessage, "error");

      setErrors({
        server:
          "Unable to complete registration at this time. Please try again.",
      });
    }
  };

  const handlePhoneVerify = async () => {
    try {
      await sendVerificationCode(phoneNumber);
      setOtpVisible(true);
      showToast("OTP sent successfully.", "success");
    } catch (err: any) {
      showToast(error || "Failed to send OTP", "error");
    }
  };
  const handleOtpSubmit = async () => {
    const isValid = await verifyOtp();

    if (!isValid) {
      showToast(error || "Invalid OTP", "error");
    } else {
      showToast("Phone verified successfully.", "success");
      setOtpVisible(false);
    }
  };
  const handleVerifyPhone = () => {
    console.log(
      "Invalid phone number format:",
      phoneNumber,
      " Bool:",
      !phoneNumber,
    );
    console.log(
      "Validation result:",
      validatePhone(phoneNumber),
      "Bool:",
      !validatePhone(phoneNumber),
    );

    if (!phoneNumber || !validatePhone(phoneNumber)) {
      showToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    } else {
      handlePhoneVerify();
    }

    // Generate dummy OTP (for now)
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

    setGeneratedOtp(randomOtp);
    setShowOtpInput(true);

    console.log("Generated OTP:", randomOtp); // remove in production

    showToast("OTP sent to your mobile number.", "success");
  };

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

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, "");
    return cleanPhone.length === 10;
  };

  const handleBackToLogin = () => {
    resetAuth();
    router.navigate("/Tailor/login");
  };

  if (isRegistered) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <ThemedText
            style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}
          >
            Account Created Successfully
          </ThemedText>
          <ThemedText style={{ textAlign: "center", marginBottom: 30 }}>
            Welcome to TailorJunction, {fullName}.
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={{ flex: 1, padding: 20, backgroundColor: colors.primary }}
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

            <ThemedText style={{ marginBottom: 8 }}>Phone Number</ThemedText>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <TextInput
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setPhoneNumber(formatted);
                  clearLocalError("phone");
                }}
                keyboardType="phone-pad"
                maxLength={14}
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: errors.phone ? "#EF4444" : "#494545",
                  borderRadius: 8,
                  backgroundColor: colors.background,
                }}
                placeholderTextColor={colors.primary}
              />

              <TouchableOpacity
                onPress={handleVerifyPhone}
                disabled={isLoading}
                style={{
                  marginLeft: 8,
                  backgroundColor: "#0a7ea4",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 8,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  Verify
                </ThemedText>
              </TouchableOpacity>
            </View>

            {otpVisible && (
              <>
                <ThemedText style={{ marginBottom: 8 }}>Enter OTP</ThemedText>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{
                      flex: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: "#494545",
                      borderRadius: 8,
                      backgroundColor: colors.background,
                    }}
                    placeholderTextColor={colors.primary}
                  />

                  <TouchableOpacity
                    onPress={handleOtpSubmit}
                    style={{
                      marginLeft: 8,
                      backgroundColor: "#16a34a",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 8,
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                      Submit
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
            {errors.phone && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.phone}
              </ThemedText>
            )}
            {!errors.phone && <View style={{ marginBottom: 16 }} />}

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

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                alignItems: "center",
              }}
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

export default PersonalDetails;
