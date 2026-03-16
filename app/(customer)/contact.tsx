// app/(customer)/contact.tsx
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function ContactScreen() {
  const { userId, API_URL } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !message) {
      showToast("Please fill in both email and message fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/customer/complaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: userId, email, message }),
      });
      const data = await response.json();

      if (data.success) {
        showToast(
          "Your complaint has been registered. Our team will contact you soon.",
          "success",
        );
        setEmail("");
        setMessage("");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to submit complaint.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Contact Us</Text>

        {/* Complaint Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register a Complaint</Text>
          <Text style={styles.cardSubtitle}>
            Please enter your email ID and describe your issue below.
          </Text>

          <Text style={styles.label}>Email ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email ID"
            placeholderTextColor={styles.contactText.color}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Complaint Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your issue or feedback here..."
            placeholderTextColor={styles.contactText.color}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Details Card */}
        <View style={[styles.card, { backgroundColor: "#f8fafc" }]}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          <View style={styles.supportRow}>
            <View style={styles.iconCircle}>
              <Text
                style={{ fontSize: 12, fontWeight: "bold", color: "#f59e0b" }}
              >
                24/7
              </Text>
            </View>
            <Text style={styles.supportText}>
              For immediate assistance, feel free to reach out to us. Our
              customer support is available 24/7!
            </Text>
          </View>

          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="email" size={20} color="#3b82f6" />
            <Text style={styles.contactText}>tailorjunction@gmail.com</Text>
          </View>

          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone" size={20} color="#3b82f6" />
            <Text style={styles.contactText}>+91 7305417685</Text>
          </View>

          <View style={styles.contactRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#3b82f6"
            />
            <Text style={styles.contactText}>
              10/2 Pattinathar St, Mogappair East, Chennai - 37
            </Text>
          </View>

          {/* Social Icons */}
          <View style={styles.socialRow}>
            <MaterialCommunityIcons
              name="facebook"
              size={30}
              color="#3b82f6"
              style={styles.socialIcon}
            />
            <MaterialCommunityIcons
              name="whatsapp"
              size={30}
              color="#10b981"
              style={styles.socialIcon}
            />
            <MaterialCommunityIcons
              name="instagram"
              size={30}
              color="#ec4899"
              style={styles.socialIcon}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff",
    padding: 15,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 5,
  },
  cardSubtitle: { fontSize: 12, color: "gray", marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  supportText: { flex: 1, fontSize: 12, color: "gray", lineHeight: 18 },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  contactText: { marginLeft: 10, fontSize: 14, color: "#334155" },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  socialIcon: { marginHorizontal: 15, marginBottom: 30 },
});
