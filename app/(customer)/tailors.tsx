// app/(customer)/tailors.tsx
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TailorsScreen() {
  const { userId, API_URL, socket } = useAuth();

  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal States
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState<any>(null);
  const [urgency, setUrgency] = useState("normal");
  const [measurementType, setMeasurementType] = useState("tailor_measure");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchTailors();

    // 🚀 Listen for real-time status changes
    if (socket) {
      socket.on(
        "tailorStatusChanged",
        (data: { tailorId: string; status: string }) => {
          setTailors((prevTailors) =>
            prevTailors.map((tailor) =>
              tailor.tailor_id === data.tailorId
                ? { ...tailor, availability_status: data.status }
                : tailor,
            ),
          );
        },
      );
    }

    return () => {
      if (socket) socket.off("tailorStatusChanged");
    };
  }, [socket]);

  const fetchTailors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer/tailors`);
      const data = await res.json();
      if (data.success) setTailors(data.tailors);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (tailor: any) => {
    setSelectedTailor(tailor);
    setBookingModalVisible(true);
  };

  const submitOrder = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/customer/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          tailorId: selectedTailor.tailor_id,
          dressId: 1, // You would typically fetch this from a dropdown of dress types
          urgency: urgency,
          measurementType: measurementType,
        }),
      });

      console.log(
        "Sending Query",
        `INSERT INTO orders (customer_id, tailor_id, dress_id, urgency, measurement_type, order_status) 
       VALUES (${userId}, ${selectedTailor.tailor_id}, 1, '${urgency}', '${measurementType}', 'pending')`,
      );

      const data = await response.json();
      if (data.success) {
        showToast(
          "Your order has been placed. Check the Orders tab.",
          "success",
        );
        setBookingModalVisible(false);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("Failed to place order. Check connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  // 🚀 HIGH PERFORMANCE RENDER FUNCTION (For 2GB RAM Devices)
  const renderTailor = ({ item: tailor }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image
          source={{ uri: getImageUrl(tailor.profile_photo) }}
          style={styles.avatar}
        />
        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.tailorName}>{tailor.shop_name}</Text>
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    tailor.availability_status === "available"
                      ? "green"
                      : "red",
                },
              ]}
            >
              {tailor.availability_status === "available"
                ? "Available"
                : "Unavailable"}
            </Text>
          </View>
          <Text style={styles.subText}>
            ⭐ {tailor.rating} | 📍 {tailor.area || "Nearby"}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <TouchableOpacity>
          <Text style={styles.linkText}>View Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bookBtn,
            { opacity: tailor.availability_status === "available" ? 1 : 0.5 },
          ]}
          disabled={tailor.availability_status !== "available"}
          onPress={() => handleBookNow(tailor)}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Search Your Best Tailor</Text>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="gray" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop name..."
        />
      </View>

      {/* 🚀 FLATLIST MEMORY OPTIMIZATIONS */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={tailors}
          keyExtractor={(item) => item.tailor_id}
          renderItem={renderTailor}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5} // Only render 5 items initially (Saves RAM)
          maxToRenderPerBatch={5} // Render 5 items per scroll batch
          windowSize={5} // Keep fewer items in memory off-screen
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* BOOKING MODAL */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Book {selectedTailor?.shop_name}
            </Text>

            <Text style={styles.label}>Urgency</Text>
            <View style={styles.optionsRow}>
              {["normal", "1_day", "2_day"].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.optionBtn,
                    urgency === u && styles.activeOption,
                  ]}
                  onPress={() => setUrgency(u)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      urgency === u && { color: "#fff" },
                    ]}
                  >
                    {u.replace("_", " ").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Measurement Type</Text>
            <View style={styles.optionsRow}>
              {["tailor_measure", "old_cloth_reference"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.optionBtn,
                    measurementType === m && styles.activeOption,
                  ]}
                  onPress={() => setMeasurementType(m)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      measurementType === m && { color: "#fff" },
                    ]}
                  >
                    {m === "tailor_measure" ? "Tailor Measures" : "Old Cloth"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setBookingModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitOrderBtn}
                onPress={submitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitOrderText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 25,
    elevation: 2,
    marginBottom: 20,
  },
  searchInput: { flex: 1, marginLeft: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", marginBottom: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  infoBlock: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tailorName: { fontSize: 16, fontWeight: "bold", color: "#1e3a8a" },
  statusText: { fontSize: 12, fontWeight: "bold" },
  subText: { fontSize: 12, color: "gray", marginTop: 2 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 10,
  },
  linkText: { color: "#3b82f6", fontSize: 12, fontWeight: "bold" },
  bookBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  activeOption: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  optionText: { fontSize: 12, color: "#475569" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    padding: 15,
    borderRadius: 25,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: { color: "#64748b", fontWeight: "bold" },
  submitOrderBtn: {
    padding: 15,
    borderRadius: 25,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#3b82f6",
  },
  submitOrderText: { color: "#fff", fontWeight: "bold" },
});
