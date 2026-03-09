// app/(auth)/personalDetails.tsx

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

const PersonalDetails: React.FC<{ onNext: () => void }> = ({ onNext }) => {
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
  } = useAuth();

  const labelColor = "#000000";
  const { colors } = useTheme();

  const { showToast } = useToast();

  const today = new Date();
  // Calculate max and min dates for DOB (between 18 and 90 years old)
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  const minDate = new Date(
    today.getFullYear() - 90,
    today.getMonth(),
    today.getDate(),
  );

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    server?: string;
    dob?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
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
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (!phoneNumber) {
      newErrors.phone = "Mobile number is required.";
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number.";
    }
    if (!dob) newErrors.dob = "Please select your date of birth.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (text: string): string => {
    const clean = text.replace(/\D/g, "");
    if (clean.length <= 5) return clean;
    return `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDobPicker(Platform.OS === "ios");
    if (selectedDate) {
      setDob(selectedDate);
      clearLocalError("dob");
    }
  };

  const handleSignUp = async () => {
    setSubmitAttempted(true);
    if (!validateForm()) {
      showToast("Please correct the highlighted fields.", "warning");
      return;
    } else if (!verifiedOtp) {
      showToast("Please verify your phone number.", "warning");
      return;
    } else {
      setErrors({});

      try {
        showToast("Creating your account. Please wait...", "success");

        showToast(
          `Welcome ${fullName}. Your account has been created successfully.`,
          "success",
        );

        onNext(); // Move to next step after successful signup
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
    }
  };

  const handlePhoneVerify = async () => {
    try {
      setOtpVisible(true);
      await sendVerificationCode(phoneNumber);
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
  const handleVerifyPhone = async () => {
    console.log(
      "Validation result:",
      validatePhone(phoneNumber),
      "Bool:",
      !validatePhone(phoneNumber),
    );
    console.log(
      "Phone exists check: here's the promise:",
      await checkPhoneExists(phoneNumber),
    );
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      showToast("Please enter a valid 10-digit mobile number.", "warning");
      return;
    } else if (await checkPhoneExists(phoneNumber)) {
      showToast("This phone number is already registered.", "error");
      setOtpVisible(false);
      return;
    } else {
      handlePhoneVerify();
    }

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
    router.navigate("/tailor/login");
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
            {!errors.name && <View style={{ marginBottom: 16 }} />}

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <ThemedText style={{ marginBottom: 8, color: labelColor }}>
                Phone Number
              </ThemedText>
              {/* Show verified icon if OTP is verified */}
              {verifiedOtp && (
                <Image
                  source={Images.verified}
                  style={{ width: 24, height: 24, marginRight: 8, left: 5 }}
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
                  color: colors.text,
                }}
                placeholderTextColor={colors.text}
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

            <ThemedText style={{ marginBottom: 8, color: labelColor }}>
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

            {/* Date of Birth Picker */}
            <ThemedText style={{ marginBottom: 8, color: labelColor }}>
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
              <ThemedText style={{ color: dob ? colors.text : colors.primary }}>
                {dob ? dob.toLocaleDateString() : "Select your date of birth"}
              </ThemedText>
            </TouchableOpacity>
            {showDobPicker && (
              <DateTimePicker
                value={dob || maxDate}
                mode="date"
                display="default"
                maximumDate={maxDate} // Age must be at least 18
                minimumDate={minDate} // Age cannot exceed 90
                onChange={handleDateChange}
              />
            )}
            {errors.dob && (
              <ThemedText style={{ marginBottom: 16, color: "#EF4444" }}>
                {errors.dob}
              </ThemedText>
            )}
            {!errors.dob && <View style={{ marginBottom: 16 }} />}

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
                style={{ flex: 1, paddingVertical: 10, color: colors.text }}
                placeholderTextColor={colors.primary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <ThemedText style={{ fontSize: 16, color: colors.primary }}>
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
                  Next
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
              <ThemedText style={{ color: colors.text }}>
                Already have an account?
              </ThemedText>
              <TouchableOpacity onPress={handleBackToLogin}>
                <ThemedText style={{ fontWeight: "600", color: colors.text }}>
                  Log in
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalDetails;
