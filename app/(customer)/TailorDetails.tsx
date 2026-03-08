import FunnyScrollView from "@/components/FunnyScrollView";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function TailorDetailsScreen() {
  const { tailorId } = useLocalSearchParams();
  const { userId, API_URL } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🚀 Standard Booking States
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedDress, setSelectedDress] = useState<any>(null);
  const [measurementType, setMeasurementType] = useState("tailor_measure");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [tailorId]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/customer/tailors/${tailorId}/details`,
      );
      const result = await res.json();
      if (result.success) setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (data?.profile?.map_link) Linking.openURL(data.profile.map_link);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  const openBookingModal = (dress: any) => {
    setSelectedDress(dress);
    setMeasurementType("tailor_measure"); // Reset default
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/customer/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          tailorId: tailorId,
          dress_id: selectedDress.dress_id,
          dress_image: selectedDress.dress_image,
          measurement_type: measurementType,
          price: selectedDress.price,
        }),
      });
      const result = await res.json();

      if (result.success) {
        Alert.alert("Success!", "Your order has been sent to the tailor.");
        setBookingModalVisible(false);
        // Navigate back to the Orders screen so they can track it!
        router.push("/(customer)/Order");
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Network issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );
  if (!data)
    return <Text style={styles.errorText}>Tailor profile not found.</Text>;

  const { profile, pricing, reviews } = data;
  const address = `${profile.house_no}, ${profile.street}, ${profile.area}, ${profile.district} - ${profile.pincode}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.shop_name}</Text>
      </View>

      <FunnyScrollView
        onRefreshData={fetchDetails}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: getImageUrl(profile.profile_photo) }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.tailorName}>{profile.tailor_name}</Text>
              <Text style={styles.specText}>
                {profile.specialization.toUpperCase() == "BOTH"
                  ? "BOTH Men and Women"
                  : profile.specialization.toUpperCase()}{" "}
                Specialist
              </Text>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={18} color="#f59e0b" />
                <Text style={styles.ratingText}>
                  {parseFloat(profile.averageRating).toFixed(1)}
                </Text>
                <Text style={styles.reviewCount}>
                  ({profile.totalReviews} reviews)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.experience_years}</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.completedOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.ordersPerDay}</Text>
              <Text style={styles.statLabel}>Orders/Day</Text>
            </View>
          </View>
        </View>

        {/* LOCATION CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shop Location</Text>
          <Text style={styles.addressText}>{address}</Text>
          <TouchableOpacity style={styles.mapBtn} onPress={openGoogleMaps}>
            <MaterialCommunityIcons name="google-maps" size={20} color="#fff" />
            <Text style={styles.mapBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* PRICING CATALOG */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing Catalog</Text>
          {pricing.map((item: any, idx: number) => (
            <View key={idx} style={styles.priceRow}>
              <Image
                source={{ uri: getImageUrl(item.dress_image) }}
                style={styles.dressThumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.clothType}>{item.cloth_type}</Text>
                <Text style={styles.catText}>{item.category}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.priceValue}>₹{item.price}</Text>
                {/* 🚀 THE NEW BOOK BUTTON */}
                {profile.availability_status === "available" ? (
                  <TouchableOpacity
                    style={styles.bookSmallBtn}
                    onPress={() => openBookingModal(item)}
                  >
                    <Text style={styles.bookSmallText}>Book</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.unavailableText}>Currently Busy</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* REVIEWS SECTION */}
        <View style={[styles.card, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          ) : (
            reviews.map((rev: any, idx: number) => (
              <View key={idx} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.customerName}>
                    {rev.customer_name || "Guest"}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.reviewRating}>{rev.rating}</Text>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#f59e0b"
                    />
                  </View>
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(rev.review_datetime).toLocaleDateString()}
                </Text>
                {rev.review_text && (
                  <Text style={styles.reviewBody}>"{rev.review_text}"</Text>
                )}
              </View>
            ))
          )}
        </View>
      </FunnyScrollView>

      {/* 🚀 STANDARD BOOKING MODAL */}
      <Modal visible={bookingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Booking</Text>

            {selectedDress && (
              <View style={styles.dressSummary}>
                <Text style={styles.summaryTitle}>
                  {selectedDress.cloth_type}
                </Text>
                <Text style={styles.summaryPrice}>₹{selectedDress.price}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Measurement Type</Text>
            <TouchableOpacity
              style={[
                styles.measBtn,
                measurementType === "tailor_measure" && styles.measActive,
              ]}
              onPress={() => setMeasurementType("tailor_measure")}
            >
              <Text
                style={[
                  styles.measText,
                  measurementType === "tailor_measure" && styles.measTextActive,
                ]}
              >
                Tailor Measurement
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.measBtn,
                measurementType === "old_cloth_reference" && styles.measActive,
              ]}
              onPress={() => setMeasurementType("old_cloth_reference")}
            >
              <Text
                style={[
                  styles.measText,
                  measurementType === "old_cloth_reference" &&
                    styles.measTextActive,
                ]}
              >
                Old Cloth Reference
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmBooking}
              disabled={isSubmitting}
            >
              <Text style={styles.confirmBtnText}>
                {isSubmitting ? "Processing..." : "Place Order"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setBookingModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center" },
  errorText: { textAlign: "center", marginTop: 50, color: "red" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },

  scrollContent: { padding: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    backgroundColor: "#e2e8f0",
  },
  profileInfo: { flex: 1 },
  tailorName: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  specText: { fontSize: 13, color: "#3b82f6", fontWeight: "600", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
    color: "#1e293b",
  },
  reviewCount: { fontSize: 12, color: "#64748b", marginLeft: 6 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 15,
  },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 15,
  },
  mapBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  mapBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  dressThumb: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#f1f5f9",
  },
  clothType: { fontSize: 15, fontWeight: "600", color: "#334155" },
  catText: { fontSize: 12, color: "#94a3b8" },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 6,
  },

  // 🚀 New Book Button Styles
  bookSmallBtn: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  bookSmallText: { color: "#3b82f6", fontWeight: "bold", fontSize: 12 },
  unavailableText: { color: "#ef4444", fontSize: 11, fontStyle: "italic" },

  emptyText: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: { fontSize: 14, fontWeight: "bold", color: "#334155" },
  reviewRating: { fontSize: 13, fontWeight: "bold", marginRight: 2 },
  reviewDate: { fontSize: 11, color: "#94a3b8", marginTop: 2, marginBottom: 6 },
  reviewBody: { fontSize: 13, color: "#475569", fontStyle: "italic" },

  // 🚀 Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },
  dressSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 16, fontWeight: "bold", color: "#334155" },
  summaryPrice: { fontSize: 16, fontWeight: "bold", color: "#10b981" },

  measBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  measActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  measText: { textAlign: "center", fontWeight: "bold", color: "#64748b" },
  measTextActive: { color: "#3b82f6" },

  confirmBtn: {
    backgroundColor: "#1e3a8a",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: "center", marginTop: 5 },
  cancelText: { color: "#64748b", fontWeight: "bold" },
});
