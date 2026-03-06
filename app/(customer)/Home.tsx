// app/(customer)/Home.tsx
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterButtonProps {
  text: string;
}

export default function CustomerHome() {
  const { resetAuth, API_URL, socket } = useAuth();

  // Location States
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [placeName, setPlaceName] = useState("Unknown");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Backend Data States
  const [tailors, setTailors] = useState<any[]>([]);
  const [loadingTailors, setLoadingTailors] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshLocation();
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
  }, [socket]); // Re-run if socket connection changes

  // --- LOCATION LOGIC ---
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

        const place =
          placemarks[0]?.city ||
          placemarks[0]?.subregion ||
          placemarks[0]?.region ||
          "Nearby";
        setPlaceName(place);
      }
    } catch (error) {
      console.log("Location refresh error:", error);
      setPlaceName("Location Error");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatLocation = (coords: Location.LocationObjectCoords) => {
    const lat = coords.latitude.toFixed(4);
    const lng = coords.longitude.toFixed(4);
    return `📍 ${placeName} (Lati: ${lat}, Long: ${lng})`;
  };

  // --- BACKEND LOGIC ---
  const fetchTailors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer/tailors`);
      const data = await res.json();
      if (data.success) setTailors(data.tailors.slice(0, 3)); // Show top 3 on home
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingTailors(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return Images.placeholder;
    const cleanPath = path.replace(/^src\//, "").replace(/^\//, "");
    return `${API_URL}/${cleanPath}`;
  };

  const handleLogout = () => {
    resetAuth();
    router.push("/(auth)/customer/login");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Location & Refresh */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeText}>Welcome, Guest</Text>
              <Text style={styles.locationText}>
                {location ? formatLocation(location) : "Fetching location..."}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={refreshLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh" size={24} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#555" />
          <TextInput
            placeholder="Search by shop name or keyword"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <FilterButton text="💰 Price" />
          <FilterButton text="⭐ Rating" />
          <FilterButton text="📏 Distance" />
          <FilterButton text="⏱ Urgency" />
        </View>

        {/* Quick Services */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Place Free Orders: Booking Service
          </Text>
          <View style={styles.serviceChips}>
            {["Stitching", "Alteration", "Kaja Button", "Overlock"].map(
              (svc) => (
                <View key={svc} style={styles.chip}>
                  <Text style={styles.chipText}>{svc}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* Fast Service */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Fast Service</Text>
          <View style={styles.fastServiceContainer}>
            <View style={styles.fastRow}>
              <Text>Stitching within 1 Day</Text>
              <Text style={styles.priceTag}>Pay ₹ 700</Text>
            </View>
            <View style={styles.fastRow}>
              <Text>Stitching within 2 Days</Text>
              <Text style={styles.priceTag}>Pay ₹ 100</Text>
            </View>
            <View style={styles.fastRow}>
              <Text>Stitching within 3 Days</Text>
              <Text style={styles.priceTag}>Pay ₹ 50</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Tailor List */}
        <View style={styles.sectionContainer}>
          {loadingTailors ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            tailors.map((tailor) => (
              <View key={tailor.tailor_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons
                      name="content-cut"
                      size={20}
                      color="#ef4444"
                    />
                    <Text style={styles.tailorName}>{tailor.shop_name}</Text>
                  </View>
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
                      ⭐ {tailor.rating} | 1.2 km
                    </Text>
                    <Text style={styles.subText}>
                      💰 Starting at ₹{tailor.starting_price}
                    </Text>
                    <Text style={styles.subText}>⏱ Delivery: 2 Days</Text>
                  </View>
                  <Image
                    source={{ uri: getImageUrl(tailor.profile_photo) }}
                    style={styles.tailorImage}
                  />
                </View>

                <View style={styles.cardButtons}>
                  <TouchableOpacity style={styles.viewBtn}>
                    <Text style={styles.btnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bookBtn}>
                    <Text style={styles.btnText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Map FAB */}
      <TouchableOpacity style={styles.mapBtn}>
        <MaterialIcons name="map" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const FilterButton: React.FC<FilterButtonProps> = ({ text }) => (
  <TouchableOpacity style={styles.filterBtn}>
    <Text style={styles.filterBtnText}>{text}</Text>
  </TouchableOpacity>
);

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
  locationText: { fontSize: 12, color: "gray", marginTop: 5, paddingRight: 10 },
  refreshBtn: {
    backgroundColor: "#3b82f6",
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: { marginLeft: 10, flex: 1 },
  filters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  filterBtn: {
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterBtnText: { fontSize: 12, color: "#334155" },
  sectionContainer: { paddingHorizontal: 15, marginBottom: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
  },
  serviceChips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { color: "#0369a1", fontSize: 12, fontWeight: "600" },
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
  },
  priceTag: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: "bold",
    overflow: "hidden",
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
    alignItems: "center",
    marginBottom: 12,
  },
  tailorName: { fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  tailorBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  subText: { color: "#64748b", marginBottom: 4, fontSize: 13 },
  tailorImage: { width: 70, height: 70, borderRadius: 35 },
  cardButtons: { flexDirection: "row", justifyContent: "space-between" },
  viewBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    borderRadius: 20,
    width: "48%",
    alignItems: "center",
  },
  bookBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 20,
    width: "48%",
    alignItems: "center",
  },
  btnText: { fontWeight: "bold", color: "#1e293b" },
  mapBtn: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#1e3a8a",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
});
