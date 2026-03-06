import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function MeasurementsScreen() {
  const { orderId } = useLocalSearchParams();
  const { API_URL } = useAuth();
  const [measurements, setMeasurements] = useState({
    neck: "",
    chest: "",
    waist: "",
    hips: "",
    inseam: "",
    sleeve: "",
  });
  const [loading, setLoading] = useState(false);

  // In a real app, you would fetch existing measurements from the database here

  const saveMeasurements = async () => {
    setLoading(true);
    try {
      // Assuming you create a PUT route to update the measurements JSON column in the orders table
      const res = await fetch(`${API_URL}/api/orders/${orderId}/measurements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements }),
      });

      if (res.ok) {
        Alert.alert("Success", "Measurements saved securely.");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save measurements.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Measurements for #{orderId}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        {Object.keys(measurements).map((key) => (
          <View key={key} style={styles.inputGroup}>
            <Text style={styles.label}>
              {key.charAt(0).toUpperCase() + key.slice(1)} (inches)
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`Enter ${key} size`}
              value={measurements[key as keyof typeof measurements]}
              onChangeText={(val) =>
                setMeasurements({ ...measurements, [key]: val })
              }
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveMeasurements}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Measurements</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1e3a8a" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  saveBtn: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
});
