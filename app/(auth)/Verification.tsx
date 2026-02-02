// verification.tsx - TOAST INTEGRATED
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ToastProvider, useToast } from "@/hooks/useToast"; // ✅ NEW
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const VerificationScreenContent = () => {
  const {
    phoneNumber,
    otp,
    setOtp,
    verificationCode,
    setCurrentStep,
    sendVerificationCode,
  } = useAuth();
  const { showToast } = useToast(); // ✅ TOAST HOOK

  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [otpExpired, setOtpExpired] = useState(false);
  const colors = Colors["light"];

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        const receivedOtp = notification.request.content.data?.otp;
        if (receivedOtp && receivedOtp.length === 6) {
          setOtp(receivedOtp);
          showToast(`OTP ${receivedOtp} auto-filled!`, "success"); // ✅ GREEN TOAST
        }
      },
    );

    return () => subscription.remove();
  }, [setOtp, showToast]);

  useEffect(() => {
    if (timeLeft > 0 && !otpExpired) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !otpExpired) {
      setOtpExpired(true);
      setCanResend(true);
      showToast("OTP expired! Request new one.", "warning"); // ✅ YELLOW TOAST
    }
  }, [timeLeft, otpExpired, showToast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setOtp(cleaned.slice(0, 6));
    if (error) setError("");
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError("Enter 6-digit code");
      showToast("Please enter 6-digit code", "error"); // ✅ RED TOAST
      return;
    }
    if (otpExpired) {
      setError("OTP expired");
      showToast("OTP has expired", "error"); // ✅ RED TOAST
      return;
    }

    if (otp === verificationCode) {
      showToast("Phone verified successfully!", "success"); // ✅ GREEN TOAST
      setCurrentStep("signup");
      router.replace("/(customer)/Home");
    } else {
      setError("Wrong code");
      showToast("Incorrect verification code", "error"); // ✅ RED TOAST
    }
  };

  const handleResendCode = async () => {
    try {
      setCanResend(false);
      setTimeLeft(300);
      setOtp("");
      setError("");
      setOtpExpired(false);

      await sendVerificationCode(phoneNumber);
      showToast("New OTP sent successfully!", "success"); // ✅ GREEN TOAST
    } catch (error) {
      showToast("Failed to send OTP", "error"); // ✅ RED TOAST
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <ThemedView
          style={{ flex: 1, padding: 20, justifyContent: "space-between" }}
        >
          <View style={{ marginTop: 30 }}>
            <ThemedText
              style={{
                textAlign: "center",
                marginBottom: 30,
                fontSize: 28,
                fontWeight: "bold",
              }}
            >
              Enter OTP
            </ThemedText>

            <ThemedText style={{ marginBottom: 20, textAlign: "center" }}>
              Sent to +91{" "}
              <ThemedText style={{ fontWeight: "bold" }}>
                {phoneNumber}
              </ThemedText>
            </ThemedText>

            <View style={{ marginBottom: 20 }}>
              <TextInput
                value={otp}
                onChangeText={handleOtpInput}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••••"
                editable={!otpExpired}
                style={{
                  textAlign: "center",
                  fontSize: 24,
                  letterSpacing: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: error ? "#FF6B6B" : "#3FE1E8",
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  color: colors.text,
                  fontWeight: "bold",
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginTop: 16,
                  justifyContent: "center",
                }}
              >
                {Array.from("123456").map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 50,
                      height: 50,
                      borderWidth: 2,
                      borderColor: otp[i] ? "#3FE1E8" : "#E0E0E0",
                      borderRadius: 12,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: otp[i] ? "#3FE1E8" : "transparent",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        color: otp[i] ? "#FFF" : "transparent",
                      }}
                    >
                      {otp[i] || "•"}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <ThemedText
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: timeLeft <= 60 ? "#FF6B6B" : "#666",
                }}
              >
                Expires: {formatTime(timeLeft)}
              </ThemedText>
            </View>

            {error && (
              <ThemedText
                style={{
                  textAlign: "center",
                  marginBottom: 20,
                  color: "#FF6B6B",
                  fontWeight: "600",
                }}
              >
                {error}
              </ThemedText>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
                marginBottom: 30,
              }}
            >
              <ThemedText>Didn't get code?</ThemedText>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <ThemedText style={{ fontWeight: "bold", color: "#3FE1E8" }}>
                    Resend
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <ThemedText style={{ fontWeight: "600", color: "#666" }}>
                  {formatTime(timeLeft)}
                </ThemedText>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={otp.length !== 6 || otpExpired}
            style={{
              backgroundColor:
                otp.length === 6 && !otpExpired ? "#3FE1E8" : "#E0E0E0",
              paddingVertical: 16,
              borderRadius: 12,
              marginBottom: 30,
            }}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 18,
                color: otp.length === 6 && !otpExpired ? "#FFF" : "#999",
              }}
            >
              Verify OTP
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ✅ Wrap with ToastProvider
const VerificationScreen = () => (
  <ToastProvider>
    <VerificationScreenContent />
  </ToastProvider>
);

export default VerificationScreen;
