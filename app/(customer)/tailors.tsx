// app/(customer)/tailors.tsx
import DressCard from "@/components/DressCard";
import FunnyScrollView from "@/components/FunnyScrollView";
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const URGENCY_FEES = { normal: 0, "2_day": 100, "1_day": 200 };

export default function TailorsScreen() {
  const { userId, API_URL, socket } = useAuth();

  // 🚀 Catching the dressId instead of string name
  const { dressId } = useLocalSearchParams();
  const { showToast } = useToast();

  const [localDressId, setLocalDressId] = useState<string>("");
  const [tailors, setTailors] = useState<any[]>([]);
  const [allDresses, setAllDresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // Sync Router Params
  useEffect(() => {
    if (dressId) {
      setLocalDressId(Array.isArray(dressId) ? dressId[0] : dressId);
    } else {
      setLocalDressId("");
    }
  }, [dressId]);

  useEffect(() => {
    fetchTailors();
  }, [localDressId]);

  useEffect(() => {
    getUserLocation();
    fetchDressTypes();

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

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      let newLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(newLoc.coords);
    }
  };

  const fetchTailors = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/customer/tailors`;
      if (localDressId) {
        url += `?dressId=${encodeURIComponent(localDressId)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setTailors(data.tailors);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDressTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dress-types`);
      const data = await res.json();
      if (data.success) setAllDresses(data.data);
    } catch (error) {}
  };

  // Find Context based on ID
  const targetDressContext = useMemo(() => {
    if (!localDressId || allDresses.length === 0) return null;
    return allDresses.find(
      (d) => d.dress_id.toString() === localDressId.toString(),
    );
  }, [localDressId, allDresses]);

  const getDistanceInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const getRawDistance = (mapLink: string) => {
    if (!location || !mapLink) return Infinity;
    const match = mapLink.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match)
      return getDistanceInKm(
        location.latitude,
        location.longitude,
        parseFloat(match[1]),
        parseFloat(match[2]),
      );
    return Infinity;
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return Images.placeholder;
    return {
      uri: `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`,
    };
  };

  const processedTailors = useMemo(() => {
    let results = tailors.map((t) => ({
      ...t,
      distNum: getRawDistance(t.map_link),
    }));

    // 🚀 CRASH FIX: Added `|| ""` so .toLowerCase() never hits null
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (t) =>
          (t.shop_name || "").toLowerCase().includes(q) ||
          (t.area || "").toLowerCase().includes(q),
      );
    }

    if (activeFilter) {
      results.sort((a, b) => {
        if (activeFilter === "Rating")
          return sortOrder === "desc"
            ? parseFloat(b.rating) - parseFloat(a.rating)
            : parseFloat(a.rating) - parseFloat(b.rating);
        if (activeFilter === "Experience")
          return sortOrder === "desc"
            ? parseInt(b.experience_years || 0) -
                parseInt(a.experience_years || 0)
            : parseInt(a.experience_years || 0) -
                parseInt(b.experience_years || 0);
        if (activeFilter === "Distance")
          return sortOrder === "asc"
            ? a.distNum - b.distNum
            : b.distNum - a.distNum;

        if (activeFilter === "Price") {
          const fallbackVal = sortOrder === "asc" ? 999999 : 0;
          const pA = Number(
            a.specific_price || a.starting_price || fallbackVal,
          );
          const pB = Number(
            b.specific_price || b.starting_price || fallbackVal,
          );
          return sortOrder === "asc" ? pA - pB : pB - pA;
        }
        return 0;
      });
    }
    return results;
  }, [tailors, searchQuery, activeFilter, sortOrder, location]);

  const handleBookNow = async (tailor: any) => {
    setSelectedTailor(tailor);
    setBookingModalVisible(true);
    setIsCatalogLoading(true);
    setUrgency("normal");
    setMeasurementType("tailor_measure");
    if (targetDressContext) setSelectedDress(targetDressContext);
    else setSelectedDress(null);

    try {
      const res = await fetch(
        `${API_URL}/api/customer/tailors/${tailor.tailor_id}/details`,
      );
      const result = await res.json();
      if (result.success) setTailorCatalog(result.pricing);
    } catch (error) {
      showToast("Failed to load tailor catalog.", "error");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!selectedDress) return showToast("Please select a dress.", "warning");
    setIsSubmitting(true);
    const finalPrice =
      Number(
        selectedDress.price ||
          selectedDress.specific_price ||
          selectedDress.base_price,
      ) + URGENCY_FEES[urgency];

    try {
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
        showToast("Your order has been placed.", "success");
        setBookingModalVisible(false);
      } else showToast("Failed", data.error);
    } catch (error) {
      showToast("Network error.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
            setSortOrder(
              label === "Distance" || label === "Price" ? "asc" : "desc",
            );
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
          source={getImageUrl(tailor.profile_photo)}
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
                : "Busy"}
            </Text>
          </View>

          <Text style={styles.subText}>
            ⭐ {tailor.rating} | 📍{" "}
            {tailor.distNum !== Infinity
              ? `${tailor.distNum.toFixed(1)} km`
              : "N/A"}
          </Text>

          {/* 🚀 PRICE TOGGLE: Compares specific dress price OR falls back to starting price */}
          {localDressId && tailor.specific_price ? (
            <View style={styles.highlightPrice}>
              <Text style={styles.highlightPriceText}>
                Stitches {targetDressContext?.dress_name || "this dress"} for ₹
                {tailor.specific_price}
              </Text>
            </View>
          ) : tailor.starting_price ? (
            <View
              style={[
                styles.highlightPrice,
                {
                  backgroundColor: "#f8fafc",
                  borderColor: "#e2e8f0",
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.highlightPriceText, { color: "#475569" }]}>
                Starts from ₹{tailor.starting_price}
              </Text>
            </View>
          ) : (
            <Text style={styles.subText}>
              ⏱ Experience: {tailor.experience_years || 0} years
            </Text>
          )}
        </View>
      </View>
      <View style={styles.cardBottom}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(customer)/TailorDetails",
              params: { tailorId: tailor.tailor_id },
            })
          }
          style={styles.viewServicesBtn}
        >
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

  const currentBasePrice = selectedDress
    ? Number(
        selectedDress.price ||
          selectedDress.specific_price ||
          selectedDress.base_price,
      )
    : 0;
  const isPaymentRequired = urgency !== "normal";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ paddingRight: 15 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Tailors</Text>
        <View style={{ width: 26 }} />
      </View>

      {targetDressContext && (
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Comparing tailors who make:</Text>
          <DressCard
            dress={targetDressContext}
            getImageUrl={getImageUrl}
            onPress={() => {}}
          />
          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => {
              setLocalDressId("");
              router.setParams({ dressId: "" });
            }}
          >
            <Text style={styles.clearFilterText}>Clear Dress Comparison</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shop name or area..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={{ height: 50, marginBottom: 10 }}>
        <FunnyScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          onRefreshData={fetchTailors}
        >
          {renderFilterChip("map-marker-distance", "Distance")}
          {renderFilterChip("cash", "Price")}
          {renderFilterChip("star", "Rating")}
          {renderFilterChip("briefcase", "Experience")}
        </FunnyScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 50 }}
        />
      ) : processedTailors.length === 0 ? (
        <Text style={styles.emptyText}>
          No tailors found matching your criteria.
        </Text>
      ) : (
        <FlatList
          data={processedTailors}
          keyExtractor={(item) => item.tailor_id.toString()}
          renderItem={renderTailor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* DYNAMIC BOOKING MODAL */}
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
              <FunnyScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onRefreshData={fetchDressTypes}
              >
                {tailorCatalog.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dressCardModal,
                      selectedDress?.dress_id === item.dress_id &&
                        styles.dressCardActive,
                    ]}
                    onPress={() => setSelectedDress(item)}
                  >
                    <Image
                      source={getImageUrl(item.dress_image)}
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
              </FunnyScrollView>
            )}

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

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Estimate</Text>
                <Text style={styles.totalAmount}>
                  ₹{currentBasePrice + URGENCY_FEES[urgency]}
                </Text>
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a8a" },
  contextCard: {
    backgroundColor: "#eff6ff",
    margin: 15,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  contextLabel: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  clearFilterBtn: { marginTop: 10, alignItems: "center" },
  clearFilterText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#000" },
  filterScroll: { alignItems: "center", paddingLeft: 15, paddingRight: 20 },
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
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
  statusText: { fontSize: 12, fontWeight: "bold" },
  subText: { fontSize: 12, color: "#475569", marginTop: 4, fontWeight: "500" },
  highlightPrice: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  highlightPriceText: { color: "#059669", fontSize: 12, fontWeight: "bold" },
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
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 40,
  },
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
  dressCardModal: {
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
