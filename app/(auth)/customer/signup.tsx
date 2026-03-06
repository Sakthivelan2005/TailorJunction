import Header from "@/components/Header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerSignup() {
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
    dob,
    setDob,
    sendVerificationCode,
    verifyOtp,
    verifiedOtp,
    isLoading,
    error,
    resetAuth,
    checkPhoneExists,
    completeSignup,
    setRole,
  } = useAuth();

  const labelColor = "#000000";
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    dob?: string;
    server?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);

  useEffect(() => {
    setRole("customer");
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) newErrors.name = "Please enter your full name.";
    if (!email.trim() || !emailRegex.test(email))
      newErrors.email = "Please enter a valid email address.";
    if (!password || password.length < 6)
      newErrors.password = "Password must be at least 6 characters long.";
    if (!phoneNumber || !validatePhone(phoneNumber))
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    if (!dob) newErrors.dob = "Please select your date of birth.";

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

  const formatPhoneNumber = (text: string) =>
    text.replace(/\D/g, "").slice(0, 10);
  const validatePhone = (phone: string) =>
    phone.replace(/\D/g, "").length === 10;

  // --- OTP LOGIC ---
  const handleVerifyPhone = async () => {
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      showToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    }
    if (await checkPhoneExists(phoneNumber)) {
      showToast("This phone number is already registered.", "error");
      return;
    }
    try {
      setOtpVisible(true);
      await sendVerificationCode(phoneNumber);
      showToast("OTP sent to your mobile number.", "success");
    } catch (err) {
      showToast("Failed to send OTP", "error");
    }
  };

  const handleOtpSubmit = async () => {
    const isValid = await verifyOtp();
    if (isValid) {
      showToast("Phone verified successfully.", "success");
      setOtpVisible(false);
    } else {
      showToast("Invalid OTP", "error");
    }
  };

  // --- FINAL SIGNUP LOGIC ---
  const handleSignUp = async () => {
    if (!validateForm()) {
      showToast("Please correct the highlighted fields.", "warning");
      return;
    }
    if (!verifiedOtp) {
      showToast("Please verify your phone number.", "warning");
      return;
    }

    try {
      showToast("Creating your account...", "success");
      await completeSignup(); // Creates user in DB

      showToast(`Welcome ${fullName}!`, "success");
      router.replace("/(customer)/Home"); // Navigate straight to home
    } catch (err: any) {
      console.error("Signup failed:", err.message);
      setErrors({
        server: err.message || "Registration failed. Please try again.",
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDobPicker(Platform.OS === "ios");
    if (selectedDate) {
      setDob(selectedDate);
      clearLocalError("dob");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }}>
      <Header title="Sign Up" onBackPress={() => router.push("/")} />

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
                padding: 20,
                backgroundColor: "rgba(255, 255, 255, 0.79)",
                borderRadius: 26,
                margin: 15,
              }}
            >
              {/* Full Name */}
              <ThemedText style={{ marginBottom: 8, color: labelColor }}>
                Full Name
              </ThemedText>
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

              {/* Phone Number */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginTop: 12,
                }}
              >
                <ThemedText style={{ marginBottom: 8, color: labelColor }}>
                  Phone Number
                </ThemedText>
                {verifiedOtp && (
                  <Image
                    source={Images.verified}
                    style={{ width: 20, height: 20, marginLeft: 8 }}
                  />
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <TextInput
                  placeholder="10-digit number"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(formatPhoneNumber(text));
                    clearLocalError("phone");
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
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
                {!verifiedOtp && (
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
                )}
              </View>

              {/* OTP Field */}
              {otpVisible && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    marginTop: 10,
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
              )}
              {errors.phone && (
                <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                  {errors.phone}
                </ThemedText>
              )}

              {/* Email */}
              <ThemedText
                style={{ marginBottom: 8, marginTop: 12, color: labelColor }}
              >
                Email
              </ThemedText>
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearLocalError("email");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: errors.email ? "#EF4444" : "#494545",
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  marginBottom: 4,
                }}
                placeholderTextColor={colors.primary}
              />
              {errors.email && (
                <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                  {errors.email}
                </ThemedText>
              )}

              {/* Date of Birth */}
              <ThemedText
                style={{ marginBottom: 8, marginTop: 12, color: labelColor }}
              >
                Date of Birth
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowDobPicker(true)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: errors.dob ? "#EF4444" : "#494545",
                  borderRadius: 8,
                  backgroundColor: colors.background,
                  marginBottom: 4,
                }}
              >
                <ThemedText
                  style={{ color: dob ? colors.text : colors.primary }}
                >
                  {dob ? dob.toLocaleDateString() : "Select your date of birth"}
                </ThemedText>
              </TouchableOpacity>
              {showDobPicker && (
                <DateTimePicker
                  value={dob || new Date()}
                  mode="date"
                  display="default"
                  maximumDate={new Date()} // Prevent future dates
                  onChange={handleDateChange}
                />
              )}
              {errors.dob && (
                <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                  {errors.dob}
                </ThemedText>
              )}

              {/* Password */}
              <ThemedText
                style={{ marginBottom: 8, marginTop: 12, color: labelColor }}
              >
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
                  style={{ flex: 1, paddingVertical: 10, color: colors.text }}
                  placeholderTextColor={colors.primary}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
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

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? "#9CA3AF" : "#0a7ea4",
                  paddingVertical: 14,
                  borderRadius: 8,
                  marginTop: 20,
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
                    Sign Up
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <ThemedText style={{ color: colors.text }}>
                  Already have an account?
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    router.replace("/(auth)/customer/login");
                  }}
                >
                  <ThemedText style={{ fontWeight: "600", color: colors.text }}>
                    Log in
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
