// app/(customer)/Home.tsx
import FunnyScrollView from "@/components/FunnyScrollView";
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function CustomerHome() {
  const { userId, resetAuth, API_URL, socket } = useAuth();

  // Location States
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [placeName, setPlaceName] = useState("Unknown");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Backend Data States
  const [tailors, setTailors] = useState<any[]>([]);
  const [loadingTailors, setLoadingTailors] = useState(true);
  const [search, setSearch] = useState("");

  // 🚀 UBER-STYLE FAST BOOKING STATES
  const [fastModalVisible, setFastModalVisible] = useState(false);
  const [bookingStep, setBookingStep] = useState<
    "select_dress" | "select_measurement" | "searching" | "found" | "timeout"
  >("select_dress");
  const [allDresses, setAllDresses] = useState<any[]>([]);
  const [selectedFastFee, setSelectedFastFee] = useState(0);
  const [selectedUrgency, setSelectedUrgency] = useState("");
  const [selectedDress, setSelectedDress] = useState<any>(null);
  const [measurementType, setMeasurementType] = useState("tailor_measure");
  const [searchTimer, setSearchTimer] = useState(60);
  const [matchedTailor, setMatchedTailor] = useState<any>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    refreshLocation();
    fetchTailors();
    fetchDressTypes();

    if (socket) {
      // Listen for normal status changes
      socket.on("tailorStatusChanged", (data) => {
        setTailors((prev) =>
          prev.map((t) =>
            t.tailor_id === data.tailorId
              ? { ...t, availability_status: data.status }
              : t,
          ),
        );
      });

      // 🚀 Listen for Tailor Accepting the Urgent Order
      socket.on("urgentOrderAccepted", (data) => {
        if (data.customerId === userId) {
          setMatchedTailor(data.tailor);
          setBookingStep("found");
        }
      });

      return () => {
        socket.off("tailorStatusChanged");
        socket.off("urgentOrderAccepted");
      };
    }
  }, [socket]);

  // --- LOCATION & DISTANCE LOGIC ---
  const refreshLocation = async () => {
    setIsLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let newLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(newLoc.coords);
        const placemarks = await Location.reverseGeocodeAsync({
          latitude: newLoc.coords.latitude,
          longitude: newLoc.coords.longitude,
        });
        setPlaceName(
          placemarks[0]?.city || placemarks[0]?.subregion || "Nearby",
        );
      }
    } catch (error) {
      setPlaceName("Location Error");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Helper: Haversine formula to calculate km distance
  const getDistanceInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // Radius of earth
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Helper: Parse Google Maps link to get Lat/Lng
  const calculateTailorDistance = (mapLink: string) => {
    if (!location || !mapLink) return "N/A";
    const match = mapLink.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      const tLat = parseFloat(match[1]);
      const tLng = parseFloat(match[2]);
      return (
        getDistanceInKm(location.latitude, location.longitude, tLat, tLng) +
        " km"
      );
    }
    return "N/A";
  };

  // --- FETCH DATA ---
  const fetchTailors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer/tailors`);
      const data = await res.json();
      if (data.success) setTailors(data.tailors);
    } catch (error) {
    } finally {
      setLoadingTailors(false);
    }
  };

  const fetchDressTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dress-types`);
      const data = await res.json();
      if (data.success) setAllDresses(data.data);
    } catch (error) {}
  };

  // 🚀 CRITICAL FIX: Return proper object structure based on if image exists
  const getImageSource = (path: string | null) => {
    if (!path) return Images.placeholder; // Returns local require() safely
    return {
      uri: `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`,
    };
  };

  // --- FAST BOOKING LOGIC ---
  const startFastService = (fee: number, urgency: string) => {
    setSelectedFastFee(fee);
    setSelectedUrgency(urgency);
    setBookingStep("select_dress");
    setSelectedDress(null);
    setPaymentDone(false);
    setMatchedTailor(null);
    setFastModalVisible(true);
  };

  const emitUrgentOrder = () => {
    setBookingStep("searching");
    setSearchTimer(60);
    console.log("Emitting urgent order with data:", {
      customerId: userId,
      urgency: selectedUrgency,
      dress_id: selectedDress.dress_id,
      dress_name: selectedDress.dress_name,
      dress_image: selectedDress.dress_image,
      category: selectedDress.category,
      measurement_type: measurementType,
      total_price: selectedFastFee + Number(selectedDress.base_price),
      customerLocation: location,
    });

    socket?.emit("requestUrgentOrder", {
      customerId: userId,
      urgency: selectedUrgency,
      dress_id: selectedDress.dress_id,
      dress_name: selectedDress.dress_name,
      dress_image: selectedDress.dress_image,
      category: selectedDress.category,
      measurement_type: measurementType,
      total_price: selectedFastFee + Number(selectedDress.base_price),
      customerLocation: location,
    });
    // 60-Second Countdown
    let timeLeft = 60;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setSearchTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setBookingStep((prev) => (prev === "searching" ? "timeout" : prev));
      }
    }, 1000);
  };

  const handleDummyPayment = () => {
    // Simulate payment API
    setTimeout(() => {
      setPaymentDone(true);
      Alert.alert("Success", "Payment received! Location unlocked.");
    }, 1500);
  };

  const openGoogleMaps = () => {
    console.log("Opening Google Maps with link:", matchedTailor?.map_link); // Debug log for map link

    if (matchedTailor?.map_link) Linking.openURL(matchedTailor.map_link);
  };

  return (
    <View style={styles.container}>
      <FunnyScrollView
        onRefreshData={fetchTailors}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>Welcome, Guest</Text>
              <Text style={styles.locationText}>
                {location ? `📍 ${placeName}` : "Fetching location..."}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh" size={24} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                resetAuth();
                router.push("/(auth)/customer/login");
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#555" />
          <TextInput
            placeholder="Search shop name..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Fast Service Block */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Fast Service ⚡</Text>
          <View style={styles.fastServiceContainer}>
            <TouchableOpacity
              style={styles.fastRow}
              onPress={() => startFastService(700, "1_day")}
            >
              <Text style={styles.fastText}>Stitching within 1 Day</Text>
              <Text style={styles.priceTag}>Pay ₹700</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fastRow}
              onPress={() => startFastService(100, "2_day")}
            >
              <Text style={styles.fastText}>Stitching within 2 Days</Text>
              <Text style={styles.priceTag}>Pay ₹100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fastRow}
              onPress={() => startFastService(50, "3_day")}
            >
              <Text style={styles.fastText}>Stitching within 3 Days</Text>
              <Text style={styles.priceTag}>Pay ₹50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Tailor List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Nearby Tailors</Text>
          {loadingTailors ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            tailors.map((tailor) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/TailorDetails",
                    params: { tailorId: tailor.tailor_id },
                  })
                }
                key={tailor.tailor_id}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.tailorName}>{tailor.shop_name}</Text>
                  <Text
                    style={{
                      color:
                        tailor.availability_status === "available"
                          ? "green"
                          : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {tailor.availability_status === "available"
                      ? "Available"
                      : "Busy"}
                  </Text>
                </View>
                <View style={styles.tailorBody}>
                  <View>
                    <Text style={styles.subText}>
                      ⭐ {tailor.rating} | 📍{" "}
                      {calculateTailorDistance(tailor.map_link)}
                    </Text>
                    <Text style={styles.subText}>
                      💰 Starting at ₹{tailor.starting_price}
                    </Text>
                  </View>
                  {/* 🚀 CRITICAL FIX APPLIED HERE */}
                  <Image
                    source={getImageSource(tailor.profile_photo)}
                    style={styles.tailorImage}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </FunnyScrollView>

      {/* 🚀 THE MULTI-STEP FAST BOOKING MODAL */}
      <Modal
        visible={fastModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* STEP 1: SELECT DRESS */}
            {bookingStep === "select_dress" && (
              <>
                <Text style={styles.modalTitle}>Select Dress Type</Text>
                <FunnyScrollView
                  onRefreshData={fetchDressTypes}
                  style={{ maxHeight: 300 }}
                >
                  {allDresses.map((dress) => (
                    <TouchableOpacity
                      key={dress.dress_id}
                      style={styles.dressRow}
                      onPress={() => {
                        setSelectedDress(dress);
                        setBookingStep("select_measurement");
                      }}
                    >
                      {/* 🚀 CRITICAL FIX APPLIED HERE TOO */}
                      <Image
                        source={getImageSource(dress.dress_image)}
                        style={styles.dressThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dressName}>{dress.dress_name}</Text>
                        <Text style={styles.dressCat}>{dress.category}</Text>
                      </View>
                      <Text style={styles.dressPrice}>
                        + ₹{dress.base_price}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </FunnyScrollView>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setFastModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: MEASUREMENT & CONFIRM */}
            {bookingStep === "select_measurement" && (
              <>
                <Text style={styles.modalTitle}>Measurement Type</Text>
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
                      measurementType === "tailor_measure" &&
                        styles.measTextActive,
                    ]}
                  >
                    Tailor Measurement
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.measBtn,
                    measurementType === "old_cloth_reference" &&
                      styles.measActive,
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

                <View style={styles.totalBox}>
                  <Text style={styles.totalText}>
                    Fast Fee: ₹{selectedFastFee}
                  </Text>
                  <Text style={styles.totalText}>
                    Base Price: ₹{selectedDress.base_price}
                  </Text>
                  <Text style={styles.grandTotal}>
                    Total Pay: ₹
                    {Number(selectedFastFee) + Number(selectedDress.base_price)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={emitUrgentOrder}
                >
                  <Text style={styles.confirmText}>Broadcast Order Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setFastModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: SEARCHING TIMER */}
            {bookingStep === "searching" && (
              <View style={styles.centerCol}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.searchingText}>
                  Finding tailors in 5km radius...
                </Text>
                <Text style={styles.timerText}>{searchTimer}s</Text>
                <Text style={styles.subText}>
                  Please wait. Do not close app.
                </Text>
              </View>
            )}

            {/* STEP 4: TIMEOUT */}
            {bookingStep === "timeout" && (
              <View style={styles.centerCol}>
                <MaterialCommunityIcons
                  name="timer-sand-empty"
                  size={50}
                  color="gray"
                />
                <Text style={styles.searchingText}>
                  No tailors accepted in time.
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setFastModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={emitUrgentOrder}
                  >
                    <Text style={styles.confirmText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 5: FOUND & PAYMENT */}
            {bookingStep === "found" && matchedTailor && (
              <View style={styles.centerCol}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={50}
                  color="green"
                />
                <Text style={styles.modalTitle}>Order Accepted!</Text>
                <Text style={styles.dressName}>
                  {matchedTailor.shop_name} accepted your request.
                </Text>

                {!paymentDone ? (
                  <>
                    <Text style={styles.payWarning}>
                      Complete payment of ₹
                      {Number(selectedFastFee) +
                        Number(selectedDress.base_price)}{" "}
                      to unlock shop location.
                    </Text>
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={handleDummyPayment}
                    >
                      <Text style={styles.confirmText}>
                        Pay Securely via UPI
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.payWarning}>Payment Successful!</Text>
                    {/* 🚀 NATIVE GOOGLE MAPS REDIRECT */}
                    <TouchableOpacity
                      style={[styles.payBtn, { backgroundColor: "#1e3a8a" }]}
                      onPress={openGoogleMaps}
                    >
                      <Text style={styles.confirmText}>
                        Open in Google Maps 📍
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setFastModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>Done</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: { fontSize: 20, fontWeight: "bold", color: "#1e3a8a" },
  locationText: { fontSize: 12, color: "gray", marginTop: 5 },
  refreshBtn: {
    backgroundColor: "#3b82f6",
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { marginLeft: 10, flex: 1 },
  sectionContainer: { paddingHorizontal: 15, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
  },
  fastServiceContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 1,
  },
  fastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
  },
  fastText: { fontWeight: "600", color: "#334155" },
  priceTag: {
    backgroundColor: "#fee2e2",
    color: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tailorName: { fontSize: 16, fontWeight: "bold" },
  tailorBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subText: { color: "#64748b", marginBottom: 4, fontSize: 13 },
  tailorImage: { width: 70, height: 70, borderRadius: 35 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 20 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#1e3a8a",
  },
  dressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  dressThumb: { width: 40, height: 40, borderRadius: 8, marginRight: 15 },
  dressName: { fontWeight: "bold", fontSize: 15 },
  dressCat: { fontSize: 12, color: "gray" },
  dressPrice: { fontWeight: "bold", color: "#10b981" },
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
  totalBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
  },
  totalText: { color: "#64748b", marginBottom: 5 },
  grandTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 5,
  },
  confirmBtn: {
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: "center", marginTop: 5 },
  cancelText: { color: "gray", fontWeight: "bold" },
  centerCol: { alignItems: "center", paddingVertical: 20 },
  searchingText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    color: "#1e3a8a",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#ef4444",
    marginVertical: 10,
  },
  payWarning: {
    textAlign: "center",
    color: "#d97706",
    marginVertical: 20,
    fontWeight: "600",
  },
  payBtn: {
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
});
