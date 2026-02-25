// app/(tailor)/signup/PersonalDetails.tsx
import { useAuth } from "@/context/AuthContext";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import TailorSection from "./TailorSection";

const PersonalDetails: React.FC<{ onNext: (data: any) => void }> = ({
  onNext,
}) => {
  const {
    fullName,
    setFullName,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    sendVerificationCode,
    currentStep,
    setCurrentStep,
  } = useAuth();

  const [shopName, setShopName] = useState("");
  const [dob, setDob] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const handleVerifyPhone = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert("Please enter valid phone number");
      return;
    }
    try {
      await sendVerificationCode(phoneNumber);
      setShowOtp(true);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  const handleNext = () => {
    if (!fullName.trim() || !shopName.trim() || !phoneNumber || !email.trim()) {
      Alert.alert("Please fill all required fields");
      return;
    }
    onNext({ fullName, shopName, phoneNumber, email, dob });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TailorSection title="Personal Details" style={{ marginTop: 20 }}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shop name"
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyPhone}
            >
              <Text style={styles.verifyButtonText}>
                {showOtp ? "Resend" : "Verify"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showOtp && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            value={dob}
            onChangeText={setDob}
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </TailorSection>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  phoneContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  nextButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
});

export default PersonalDetails;
