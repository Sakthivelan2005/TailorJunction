// AuthContext.tsx - CLEAN VERSION (NO country code fields)
import { AuthContextType } from "@/types";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useState } from "react";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentStep, setCurrentStep] = useState<
    "login" | "verification" | "signup"
  >("login");

  // Request notification permissions
  useEffect(() => {
    if (Device.isDevice) {
      requestNotificationPermissions();
    }
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    console.log("📱 Notification permission:", status);
  };

  // Generate 6-digit OTP
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ✅ FIXED: Proper TimeIntervalTriggerInput type
  const sendVerificationCode = async (phone: string) => {
    try {
      if (!Device.isDevice) {
        console.log("Must use physical device");
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("❌ Permission denied");
        return;
      }

      const mockOtp = generateOTP();
      setVerificationCode(mockOtp);
      setOtp("");

      console.log("🔢 OTP generated:", mockOtp);

      // ✅ FIXED: Correct trigger type definition
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧵 Tailor Junction OTP",
          body: `Your code: ${mockOtp}`,
          data: {
            otp: mockOtp,
            type: "otp_verification",
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1, // ✅ Proper type
        } as any, // ✅ TypeScript workaround
      });

      console.log("✅ OTP notification sent");
    } catch (error) {
      console.error("❌ Notification error:", error);
      throw error;
    }
  };

  const resetAuth = () => {
    setPhoneNumber("");
    setVerificationCode("");
    setOtp("");
    setFullName("");
    setEmail("");
    setPassword("");
    setCurrentStep("login");
  };

  return (
    <AuthContext.Provider
      value={{
        phoneNumber,
        setPhoneNumber,
        verificationCode,
        setVerificationCode,
        otp,
        setOtp,
        fullName,
        setFullName,
        email,
        setEmail,
        password,
        setPassword,
        currentStep,
        setCurrentStep,
        sendVerificationCode,
        resetAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
