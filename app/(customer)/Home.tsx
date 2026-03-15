// app/(customer)/Home.tsx
import DressCard from "@/components/DressCard";
import FunnyScrollView from "@/components/FunnyScrollView";
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerHome() {
  const { userId, resetAuth, API_URL, socket, setFullName, fullName } =
    useAuth();

  // Location States
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [placeName, setPlaceName] = useState("Unknown");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Backend Data States
  const [tailors, setTailors] = useState<any[]>([]);
  const [allDresses, setAllDresses] = useState<any[]>([]);
  const [loadingTailors, setLoadingTailors] = useState(true);

  // Search States
  const [globalSearch, setGlobalSearch] = useState("");
  const [modalDressSearch, setModalDressSearch] = useState("");

  // UBER-STYLE FAST BOOKING STATES
  const [fastModalVisible, setFastModalVisible] = useState(false);
  const [bookingStep, setBookingStep] = useState<
    "select_dress" | "select_measurement" | "searching" | "found" | "timeout"
  >("select_dress");
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
    fetchName(userId);

    console.log("fetching Name...: ", `${API_URL}/api/users/${userId}/name`);

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

  // --- DATA FETCHING & FORMATTING ---
  const fetchName = async (userIdToFetch: string | undefined) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userIdToFetch}/name`);
      const data = await res.json();
      console.log(
        "fetching Name...: ",
        `${API_URL}/api/users/${userIdToFetch}/name`,
        "\n Response: ",
        data,
      );

      if (data.success) {
        console.log("Fetched Name:", data.fullName);
        setFullName(data.fullName);
      }
    } catch (error) {
      console.error("Failed to fetch name", error);
    }
  };

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

  const getImageSource = (path: string | null) => {
    if (!path) return Images.placeholder;
    return {
      uri: `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`,
    };
  };

  // --- MEMOIZED OPTIMIZED LISTS (Runs Fast on 2GB RAM) ---

  // 1. Top 5 Nearest Tailors (Excluding N/A)
  const nearbyTailors = useMemo(() => {
    return [...tailors]
      .map((t) => ({ ...t, distNum: getRawDistance(t.map_link) }))
      .filter((t) => t.distNum !== Infinity)
      .sort((a, b) => a.distNum - b.distNum)
      .slice(0, 5); // Limit to top 5
  }, [tailors, location]);

  // 2. Top 5 Dresses
  const topDresses = useMemo(() => allDresses.slice(0, 5), [allDresses]);

  // 3. Modal Filtered Dresses
  const modalDresses = useMemo(() => {
    if (!modalDressSearch) return allDresses;
    return allDresses.filter((d) =>
      d.dress_name.toLowerCase().includes(modalDressSearch.toLowerCase()),
    );
  }, [allDresses, modalDressSearch]);

  // 4. Global Search Results (Combines Tailors & Dresses)
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();

    const mTailors = tailors
      .filter((t) => t.shop_name.toLowerCase().includes(q))
      .map((t) => ({ ...t, searchType: "tailor" }));
    const mDresses = allDresses
      .filter(
        (d) =>
          d.dress_name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q),
      )
      .map((d) => ({ ...d, searchType: "dress" }));

    return [...mDresses, ...mTailors];
  }, [globalSearch, tailors, allDresses]);

  // --- EVENT HANDLERS ---
  const handleDressClick = (dress: any) => {
    // Navigates to Tailor Screen with pre-filled search/filter
    router.push({
      pathname: "/(customer)/tailors",
      params: { filterDress: dress.dress_name },
    });
  };

  const startFastService = (fee: number, urgency: string) => {
    setSelectedFastFee(fee);
    setSelectedUrgency(urgency);
    setBookingStep("select_dress");
    setSelectedDress(null);
    setPaymentDone(false);
    setMatchedTailor(null);
    setFastModalVisible(true);
    setModalDressSearch("");
  };

  const emitUrgentOrder = () => {
    setBookingStep("searching");
    setSearchTimer(60);
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

  // --- RENDER HELPERS ---
  const renderGlobalSearchResult = ({ item }: { item: any }) => {
    if (item.searchType === "dress") {
      return (
        <DressCard
          dress={item}
          getImageUrl={getImageSource}
          onPress={handleDressClick}
        />
      );
    }
    // Render Tailor Search Result
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(customer)/TailorDetails",
            params: { tailorId: item.tailor_id },
          })
        }
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.tailorName}>{item.shop_name}</Text>
          <Text
            style={{
              color: item.availability_status === "available" ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {item.availability_status === "available" ? "Available" : "Busy"}
          </Text>
        </View>
        <View style={styles.tailorBody}>
          <View>
            <Text style={styles.subText}>
              ⭐ {item.rating} | 📍{" "}
              {getRawDistance(item.map_link) !== Infinity
                ? getRawDistance(item.map_link).toFixed(1) + " km"
                : "N/A"}
            </Text>
          </View>
          <Image
            source={getImageSource(item.profile_photo)}
            style={styles.tailorImage}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={styles.welcomeText}
            >{`Welcome, ${fullName ? fullName : "Guest"}`}</Text>
            <Text style={styles.locationText}>
              {location ? `📍 ${placeName}` : "Fetching location..."}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshLocation}>
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

        {/* MAIN SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search tailors or dresses..."
            placeholderTextColor={styles.welcomeText.color}
            style={styles.searchInput}
            value={globalSearch}
            onChangeText={setGlobalSearch}
          />
          {globalSearch.length > 0 && (
            <TouchableOpacity onPress={() => setGlobalSearch("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DYNAMIC CONTENT AREA */}
      {globalSearch.trim().length > 0 ? (
        <FlatList
          data={globalSearchResults}
          keyExtractor={(item, index) => `${item.searchType}-${index}`}
          renderItem={renderGlobalSearchResult}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
              No results found.
            </Text>
          }
        />
      ) : (
        <FunnyScrollView
          onRefreshData={fetchTailors}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* FAST SERVICE */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Fast Service ⚡</Text>
            <View style={styles.fastServiceContainer}>
              {[
                { label: "Stitching within 1 Day", fee: 700, code: "1_day" },
                { label: "Stitching within 2 Days", fee: 100, code: "2_day" },
                { label: "Stitching within 3 Days", fee: 50, code: "3_day" },
              ].map((srv) => (
                <TouchableOpacity
                  key={srv.code}
                  style={styles.fastRow}
                  onPress={() => startFastService(srv.fee, srv.code)}
                >
                  <Text style={styles.fastText}>{srv.label}</Text>
                  <Text style={styles.priceTag}>Pay ₹{srv.fee}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DRESS VARIETIES SECTION (DRY PRINCIPLE) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Popular Dress Varieties 👗</Text>
            {topDresses.map((dress) => (
              <DressCard
                key={dress.dress_id}
                dress={dress}
                getImageUrl={getImageSource}
                onPress={handleDressClick}
              />
            ))}
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => router.push("/(customer)/dress")}
            >
              <Text style={styles.viewMoreText}>View All Dresses</Text>
            </TouchableOpacity>
          </View>

          {/* NEARBY TAILORS (FILTERED BY DISTANCE) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top 5 Nearest Tailors 📍</Text>
            {loadingTailors ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : nearbyTailors.length === 0 ? (
              <Text style={{ color: "gray", fontStyle: "italic" }}>
                No tailors found nearby.
              </Text>
            ) : (
              nearbyTailors.map((tailor) => (
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
                        ⭐ {tailor.rating} | 📍 {tailor.distNum.toFixed(1)} km
                      </Text>
                    </View>
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
      )}

      {/* THE MULTI-STEP FAST BOOKING MODAL */}
      <Modal
        visible={fastModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* STEP 1: SELECT DRESS */}
            {bookingStep === "select_dress" && (
              <SafeAreaView>
                <Text style={styles.modalTitle}>Select Dress Type</Text>

                {/* SEARCH BOX INSIDE MODAL */}
                <View
                  style={[
                    styles.searchBox,
                    { marginHorizontal: 0, marginBottom: 15 },
                  ]}
                >
                  <Ionicons name="search" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Search dress name..."
                    placeholderTextColor={styles.welcomeText.color}
                    style={styles.searchInput}
                    value={modalDressSearch}
                    onChangeText={setModalDressSearch}
                  />
                </View>

                <View style={{ maxHeight: 300 }}>
                  <FlatList
                    data={modalDresses}
                    keyExtractor={(item) => item.dress_id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: dress }) => (
                      <TouchableOpacity
                        style={styles.dressRow}
                        onPress={() => {
                          setSelectedDress(dress);
                          setBookingStep("select_measurement");
                        }}
                      >
                        <Image
                          source={getImageSource(dress.dress_image)}
                          style={styles.dressThumb}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dressName}>
                            {dress.dress_name}
                          </Text>
                          <Text style={styles.dressCat}>{dress.category}</Text>
                        </View>
                        <Text style={styles.dressPrice}>
                          + ₹{dress.base_price}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setFastModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </SafeAreaView>
            )}

            {/* STEP 2: MEASUREMENT */}
            {bookingStep === "select_measurement" && (
              <SafeAreaView>
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
                  onPress={() => setBookingStep("select_dress")}
                >
                  <Text style={styles.cancelText}>Back</Text>
                </TouchableOpacity>
              </SafeAreaView>
            )}

            {/* STEP 3 & 4 & 5... (Kept the same for brevity, rendering your existing UI logic) */}
            {/* SEARCHING */}
            {bookingStep === "searching" && (
              <SafeAreaView style={styles.centerCol}>
                <ActivityIndicator size="large" color="#ef4444" />
                <Text style={styles.searchingText}>Finding tailors...</Text>
                <Text style={styles.timerText}>{searchTimer}s</Text>
              </SafeAreaView>
            )}

            {/* TIMEOUT */}
            {bookingStep === "timeout" && (
              <SafeAreaView style={styles.centerCol}>
                <MaterialCommunityIcons
                  name="timer-sand-empty"
                  size={50}
                  color="gray"
                />
                <Text style={styles.searchingText}>
                  No tailors accepted in time.
                </Text>
                <TouchableOpacity
                  style={[styles.cancelBtn, { marginTop: 20 }]}
                  onPress={() => setFastModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>
              </SafeAreaView>
            )}

            {/* FOUND */}
            {bookingStep === "found" && matchedTailor && (
              <SafeAreaView style={styles.centerCol}>
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
                  <TouchableOpacity
                    style={[styles.payBtn, { marginTop: 20 }]}
                    onPress={() => {
                      setPaymentDone(true);
                      Alert.alert("Success", "Payment received!");
                    }}
                  >
                    <Text style={styles.confirmText}>Pay Securely via UPI</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.payBtn,
                      { backgroundColor: "#1e3a8a", marginTop: 20 },
                    ]}
                    onPress={() => Linking.openURL(matchedTailor.map_link)}
                  >
                    <Text style={styles.confirmText}>
                      Open in Google Maps 📍
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setFastModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Done</Text>
                </TouchableOpacity>
              </SafeAreaView>
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
    marginBottom: 15,
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
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 15 },

  sectionContainer: { paddingHorizontal: 15, marginBottom: 20, marginTop: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1e293b",
  },

  fastServiceContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    fontSize: 12,
  },

  card: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tailorName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  tailorBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subText: {
    color: "#64748b",
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "500",
  },
  tailorImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
  },

  viewMoreBtn: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  viewMoreText: { color: "#3b82f6", fontWeight: "bold" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#1e3a8a",
  },
  dressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  dressThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: "#f8fafc",
  },
  dressName: { fontWeight: "bold", fontSize: 15, color: "#334155" },
  dressCat: { fontSize: 12, color: "#94a3b8", marginTop: 2, fontWeight: "600" },
  dressPrice: { fontWeight: "bold", color: "#10b981", fontSize: 15 },

  measBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#f8fafc",
  },
  measActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
    borderWidth: 2,
  },
  measText: { textAlign: "center", fontWeight: "bold", color: "#64748b" },
  measTextActive: { color: "#3b82f6" },

  totalBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 12,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  totalText: { color: "#64748b", marginBottom: 5, fontWeight: "500" },
  grandTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 5,
  },

  confirmBtn: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: { padding: 15, alignItems: "center", marginTop: 5 },
  cancelText: { color: "#94a3b8", fontWeight: "bold", fontSize: 15 },

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
  payBtn: {
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
});
