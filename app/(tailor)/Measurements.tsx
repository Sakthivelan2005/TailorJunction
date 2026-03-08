import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MeasurementsScreen() {
  const { orderId } = useLocalSearchParams();
  const { API_URL, socket } = useAuth();
  const { showToast } = useToast();

  const defaultMeasurements = {
    neck: "",
    chest: "",
    waist: "",
    hips: "",
    inseam: "",
    sleeve: "",
  };

  const [measurements, setMeasurements] = useState(defaultMeasurements);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  //  Fetch existing data and listen to Sockets
  useEffect(() => {
    fetchExistingMeasurements();

    if (socket) {
      const handleUpdate = (data: { orderId: number; measurements: any }) => {
        // If THIS order gets updated by the server or another device, update the UI instantly
        if (data.orderId === Number(orderId)) {
          setMeasurements((prev) => ({ ...prev, ...data.measurements }));
        }
      };

      socket.on("measurementsUpdated", handleUpdate);
      return () => {
        socket.off("measurementsUpdated", handleUpdate);
      };
    }
  }, [socket, orderId]);

  // GET data so the Tailor can edit previous entries without losing them
  const fetchExistingMeasurements = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/measurements`);
      const data = await res.json();

      if (data.success && data.measurements) {
        // Merge fetched data with default keys so inputs don't break if a key is missing
        setMeasurements({ ...defaultMeasurements, ...data.measurements });
      }
    } catch (error) {
      console.error("Failed to fetch existing measurements", error);
    } finally {
      setIsFetching(false);
    }
  };

  //  PUT data to database
  const saveMeasurements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/measurements`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements }), // Send the full object
      });

      if (res.ok) {
        showToast("Measurements saved securely.", "success");
        // We don't router.back() immediately here if the tailor wants to keep editing,
        // but you can uncomment it if you want them to leave the screen.
        // router.back();
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      showToast("Failed to save measurements.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {`Measurements for #${orderId?.toString()}`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>
        Edit and save. All previous data is preserved.
      </Text>

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
              placeholderTextColor={styles.Placeholder.color}
              value={String(
                measurements[key as keyof typeof measurements] || "",
              )}
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
      <View style={{ height: 40 }} />
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
    marginBottom: 5,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#1e3a8a" },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
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
    color: "#000",
  },
  saveBtn: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  Placeholder: { color: "#94a3b8" },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
