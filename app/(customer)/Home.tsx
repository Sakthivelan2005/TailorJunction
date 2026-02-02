import { Tailor } from "@/data/Tailor";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterButtonProps {
  text: string;
}

const tailorsData: Tailor[] = [
  {
    id: "1",
    name: "Rajesh Tailors",
    rating: 4.6,
    distance: "1.2 km",
    price: 350,
    urgency: "2 Days",
    available: true,
  },
  {
    id: "2",
    name: "Classic Stitch",
    rating: 4.2,
    distance: "2.8 km",
    price: 500,
    urgency: "1 Day",
    available: false,
  },
];

export default function HomeScreen() {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [placeName, setPlaceName] = useState("Unknown");
  const [search, setSearch] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false); // ← Loading state

  // Format exactly as requested
  const formatLocation = (coords: Location.LocationObjectCoords) => {
    const lat = coords.latitude.toFixed(4);
    const lng = coords.longitude.toFixed(4);
    return `📍${placeName} (Lati: ${lat}, Long: ${lng})`;
  };

  // REFRESH LOCATION FUNCTION ← Manual refresh only
  const refreshLocation = async () => {
    setIsLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let newLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation(newLoc.coords);

        // Get place name
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

  // Initial location load only once
  useEffect(() => {
    refreshLocation(); // Load once on mount
  }, []);

  const renderTailor: ListRenderItem<Tailor> = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.tailorName}>✂️ {item.name}</Text>
        <Text style={{ color: item.available ? "green" : "red" }}>
          {item.available ? "Available" : "Busy"}
        </Text>
      </View>

      <Text>
        ⭐ {item.rating} | 📍 {item.distance}
      </Text>
      <Text>💰 Starting at ₹{item.price}</Text>
      <Text>⏱ Delivery: {item.urgency}</Text>

      <View style={styles.cardButtons}>
        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.btnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with REFRESH BUTTON */}
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={styles.title}>Tailor Junction</Text>
            <Text style={styles.subtitle}>
              {location ? formatLocation(location) : "No location"}
            </Text>
          </View>

          {/* ← REFRESH BUTTON */}
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
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#555" />
        <TextInput
          placeholder="Search tailor or service"
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

      {/* Tailor List */}
      <FlatList
        data={tailorsData}
        keyExtractor={(item) => item.id}
        renderItem={renderTailor}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Map FAB */}
      <TouchableOpacity style={styles.mapBtn}>
        <MaterialIcons name="map" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const FilterButton: React.FC<FilterButtonProps> = ({ text }) => (
  <TouchableOpacity style={styles.filterBtn}>
    <Text>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#3FE1E8",
    padding: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    marginTop: 5,
    color: "#333",
    fontSize: 14,
  },
  // ← NEW REFRESH BUTTON STYLE
  refreshBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    margin: 15,
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  filterBtn: {
    backgroundColor: "#EAEAEA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tailorName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  cardButtons: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  viewBtn: {
    backgroundColor: "#ccc",
    padding: 8,
    borderRadius: 20,
    width: "45%",
    alignItems: "center",
  },
  bookBtn: {
    backgroundColor: "#E879F9",
    padding: 8,
    borderRadius: 20,
    width: "45%",
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "600",
  },
  mapBtn: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
});
