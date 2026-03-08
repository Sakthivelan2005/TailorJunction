// app/(customer)/tailors.tsx
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🚀 Extra charges for urgency
const URGENCY_FEES = {
  normal: 0,
  "2_day": 100,
  "1_day": 200,
};

export default function TailorsScreen() {
  const { userId, API_URL, socket } = useAuth();

  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 🚀 DYNAMIC MODAL STATES
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState<any>(null);
  const [tailorCatalog, setTailorCatalog] = useState<any[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const [selectedDress, setSelectedDress] = useState<any>(null);
  const [urgency, setUrgency] = useState<"normal" | "2_day" | "1_day">(
    "normal",
  );
  const [measurementType, setMeasurementType] = useState("tailor_measure");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTailors();
    if (socket) {
      socket.on("tailorStatusChanged", (data) => {
        setTailors((prev) =>
          prev.map((t) =>
            t.tailor_id === data.tailorId
              ? { ...t, availability_status: data.status }
              : t,
          ),
        );
      });
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

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  // 🚀 OPEN MODAL & FETCH SPECIFIC CATALOG (Saves RAM!)
  const handleBookNow = async (tailor: any) => {
    setSelectedTailor(tailor);
    setBookingModalVisible(true);
    setIsCatalogLoading(true);
    setSelectedDress(null);
    setUrgency("normal");
    setMeasurementType("tailor_measure");

    try {
      const res = await fetch(
        `${API_URL}/api/customer/tailors/${tailor.tailor_id}/details`,
      );
      const result = await res.json();
      if (result.success) {
        setTailorCatalog(result.pricing);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load tailor catalog.");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  // 🚀 SUBMIT DYNAMIC ORDER
  const submitOrder = async () => {
    if (!selectedDress) {
      Alert.alert("Required", "Please select a dress to stitch.");
      return;
    }

    setIsSubmitting(true);
    const finalPrice = Number(selectedDress.price) + URGENCY_FEES[urgency];

    try {
      // If it's urgent, simulate a payment gateway here (in a real app you'd open Stripe/Razorpay)
      if (urgency !== "normal") {
        console.log(`Processing upfront payment of ₹${finalPrice}...`);
      }

      const response = await fetch(`${API_URL}/api/customer/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          tailorId: selectedTailor.tailor_id,
          dress_id: selectedDress.dress_id,
          dress_image: selectedDress.dress_image,
          urgency: urgency,
          measurement_type: measurementType,
          price: finalPrice,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert("Success!", "Your order has been placed successfully.");
        setBookingModalVisible(false);
      } else {
        Alert.alert("Failed", data.error || "Could not place order.");
      }
    } catch (error) {
      Alert.alert("Error", "Check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProcessedTailors = () => {
    let processed = tailors.filter(
      (t) =>
        t.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tailor_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (activeFilter) {
      processed.sort((a, b) => {
        if (activeFilter === "Rating")
          return sortOrder === "desc"
            ? parseFloat(b.rating) - parseFloat(a.rating)
            : parseFloat(a.rating) - parseFloat(b.rating);
        if (activeFilter === "Experience")
          return sortOrder === "desc"
            ? parseInt(b.experience_years) - parseInt(a.experience_years)
            : parseInt(a.experience_years) - parseInt(b.experience_years);
        return 0;
      });
    }
    return processed;
  };

  const renderFilterChip = (iconName: any, label: string) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => {
          if (activeFilter === label)
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
          else {
            setActiveFilter(label);
            setSortOrder("desc");
          }
        }}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={16}
          color={isActive ? "#1e3a8a" : "#64748b"}
        />
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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
                      ? "#10b981"
                      : "#ef4444",
                },
              ]}
            >
              {tailor.availability_status === "available"
                ? "Available"
                : "Unavailable"}
            </Text>
          </View>
          <Text style={styles.ownerText}>Owner of {tailor.tailor_name}</Text>
          <Text style={styles.subText}>
            ⭐ {tailor.rating || "New"} | 📍 {tailor.area || "Nearby"}
          </Text>
          <Text style={styles.subText}>
            ⏱ Experience: {tailor.experience_years || 0} years
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <TouchableOpacity style={styles.viewServicesBtn}>
          <Text style={styles.viewServicesText}>View Portfolio</Text>
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

  // 🚀 DYNAMIC CALCULATIONS FOR UI
  const currentBasePrice = selectedDress ? Number(selectedDress.price) : 0;
  const currentTotal = currentBasePrice + URGENCY_FEES[urgency];
  const isPaymentRequired = urgency !== "normal";

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Search Your Best Tailor</Text>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop name..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{ height: 50, marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {renderFilterChip("hanger", "Dress")}
          {renderFilterChip("cash", "Price")}
          {renderFilterChip("star", "Rating")}
          {renderFilterChip("briefcase", "Experience")}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={getProcessedTailors()}
          keyExtractor={(item) => item.tailor_id.toString()}
          renderItem={renderTailor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* 🚀 DYNAMIC BOOKING MODAL */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent={true}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Book {selectedTailor?.shop_name}
              </Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={26}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* 1. DRESS SELECTION CATALOG */}
            <Text style={styles.label}>1. Select Dress Pattern</Text>
            {isCatalogLoading ? (
              <ActivityIndicator
                size="small"
                color="#3b82f6"
                style={{ marginVertical: 20 }}
              />
            ) : tailorCatalog.length === 0 ? (
              <Text style={styles.emptyText}>
                This tailor hasn't added any dresses yet.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 20 }}
              >
                {tailorCatalog.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dressCard,
                      selectedDress?.dress_id === item.dress_id &&
                        styles.dressCardActive,
                    ]}
                    onPress={() => setSelectedDress(item)}
                  >
                    <Image
                      source={{ uri: getImageUrl(item.dress_image) }}
                      style={styles.dressThumb}
                    />
                    <Text
                      style={[
                        styles.dressName,
                        selectedDress?.dress_id === item.dress_id && {
                          color: "#3b82f6",
                        },
                      ]}
                    >
                      {item.cloth_type}
                    </Text>
                    <Text style={styles.dressPrice}>₹{item.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 2. MEASUREMENT TYPE */}
            <Text style={styles.label}>2. Measurement Method</Text>
            <View style={styles.optionsRow}>
              {[
                { id: "tailor_measure", label: "Tailor Measures" },
                { id: "old_cloth_reference", label: "Old Cloth Ref" },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.optionBtn,
                    measurementType === m.id && styles.activeOption,
                  ]}
                  onPress={() => setMeasurementType(m.id)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      measurementType === m.id && { color: "#fff" },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 3. URGENCY & DYNAMIC PRICING */}
            <Text style={styles.label}>3. Delivery Urgency</Text>
            <View style={styles.optionsRow}>
              {[
                { id: "normal", label: "Normal", extra: 0 },
                { id: "2_day", label: "2 Days", extra: 100 },
                { id: "1_day", label: "1 Day", extra: 200 },
              ].map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.urgencyBtn,
                    urgency === u.id && styles.activeUrgencyBtn,
                  ]}
                  onPress={() => setUrgency(u.id as any)}
                >
                  <Text
                    style={[
                      styles.urgencyLabel,
                      urgency === u.id && { color: "#fff" },
                    ]}
                  >
                    {u.label}
                  </Text>
                  <Text
                    style={[
                      styles.urgencyPrice,
                      urgency === u.id && { color: "#bfdbfe" },
                    ]}
                  >
                    {u.extra === 0 ? "Free" : `+₹${u.extra}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 🚀 DYNAMIC SUBMIT BUTTON */}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Estimate</Text>
                <Text style={styles.totalAmount}>₹{currentTotal}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.payBtn,
                  {
                    backgroundColor: isPaymentRequired ? "#f59e0b" : "#3b82f6",
                  },
                ]}
                onPress={submitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name={isPaymentRequired ? "credit-card" : "check-circle"}
                      size={18}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.payBtnText}>
                      {isPaymentRequired ? "Pay & Book" : "Book Now"}
                    </Text>
                  </View>
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#000" },
  filterScroll: { alignItems: "center", paddingRight: 20 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  filterChipActive: { backgroundColor: "#dbeafe", borderColor: "#bfdbfe" },
  filterChipText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "600",
  },
  filterChipTextActive: { color: "#1e3a8a", fontWeight: "bold" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", marginBottom: 15 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    backgroundColor: "#f1f5f9",
  },
  infoBlock: { flex: 1, justifyContent: "center" },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tailorName: { fontSize: 16, fontWeight: "bold", color: "#1e3a8a" },
  ownerText: { fontSize: 12, color: "#64748b", marginBottom: 6 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  subText: { fontSize: 12, color: "#475569", marginTop: 2, fontWeight: "500" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 12,
  },
  viewServicesBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewServicesText: { color: "#64748b", fontSize: 12, fontWeight: "bold" },
  bookBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyText: { color: "#64748b", fontStyle: "italic", textAlign: "center" },

  // 🚀 MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#1e3a8a" },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
    marginTop: 5,
  },

  dressCard: {
    width: 100,
    marginRight: 15,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  dressCardActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
    borderWidth: 2,
  },
  dressThumb: { width: 60, height: 60, borderRadius: 8, marginBottom: 8 },
  dressName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    height: 30,
  },
  dressPrice: { fontSize: 13, fontWeight: "bold", color: "#10b981" },

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  activeOption: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  optionText: { fontSize: 13, color: "#475569", fontWeight: "600" },

  urgencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  activeUrgencyBtn: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  urgencyLabel: { fontSize: 13, fontWeight: "bold", color: "#475569" },
  urgencyPrice: { fontSize: 11, color: "#10b981", marginTop: 2 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: { fontSize: 13, color: "#64748b" },
  totalAmount: { fontSize: 24, fontWeight: "bold", color: "#10b981" },
  payBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 3,
  },
  payBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
