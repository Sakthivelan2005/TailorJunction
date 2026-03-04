import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DashboardData {
  profile: {
    tailor_name: string;
    shop_name: string;
    profile_photo: string;
    availability_status: "available" | "unavailable";
  };
  stats: {
    completedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    averageRating: string;
    avgOrdersPerDay: string;
    daysInApp: number;
  };
}

export default function HomeScreen() {
  const { userId, resetAuth, API_URL } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/tailor/${userId}/dashboard`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
        setIsAvailable(result.profile.availability_status === "available");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    const newStatus = isAvailable ? "unavailable" : "available";
    setIsAvailable(!isAvailable); // Optimistic UI update

    try {
      await fetch(`${API_URL}/api/tailor/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      setIsAvailable(isAvailable); // Revert on failure
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!data) return <Text style={styles.errorText}>No data found</Text>;

  return (
    <ScrollView style={styles.container}>
      {/* Header Profile */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={{
              uri:
                data.profile.profile_photo || "https://via.placeholder.com/60",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{data.profile.tailor_name}</Text>
            <Text style={styles.shopName}>
              Owner of {data.profile.shop_name}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isAvailable ? "Available" : "Unavailable"}
          </Text>
          <Switch value={isAvailable} onValueChange={toggleAvailability} />
        </View>
      </View>

      {/* Grid Stats */}
      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: "#ffe6f2" }]}>
          <Text style={styles.cardValue}>{data.stats.completedOrders}</Text>
          <Text style={styles.cardLabel}>Orders Completed</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#f0f8ff" }]}>
          <Text style={styles.cardValue}>{data.stats.pendingOrders}</Text>
          <Text style={styles.cardLabel}>Orders Pending</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#f5f5f5" }]}>
          <Text style={styles.cardValue}>{data.stats.avgOrdersPerDay}</Text>
          <Text style={styles.cardLabel}>Avg Orders (Per Day)</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#e6ffe6" }]}>
          <Text style={styles.cardValue}>₹{data.stats.totalRevenue}</Text>
          <Text style={styles.cardLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#e6f7ff" }]}>
          <Text style={styles.cardValue}>{data.stats.totalCustomers}</Text>
          <Text style={styles.cardLabel}>No. of Customers</Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#f3e6ff" }]}>
          <Text style={styles.cardValue}>{data.stats.averageRating}</Text>
          <Text style={styles.cardLabel}>Rating</Text>
        </View>
      </View>

      <Text style={styles.experienceText}>
        Experience in app: {data.stats.daysInApp} Days
      </Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={resetAuth}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center" },
  errorText: { textAlign: "center", marginTop: 50 },
  header: { alignItems: "center", marginBottom: 20 },
  profileInfo: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 22, fontWeight: "bold" },
  shopName: { fontSize: 14, color: "gray" },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { marginRight: 10, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "31%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cardValue: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  cardLabel: { fontSize: 10, textAlign: "center", color: "#555" },
  experienceText: { textAlign: "center", marginVertical: 20, color: "gray" },
  logoutBtn: {
    backgroundColor: "#ff6b6b",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    alignSelf: "center",
    width: 120,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
