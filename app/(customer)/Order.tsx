// app/(customer)/Order.tsx
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrdersScreen() {
  const { userId, API_URL, socket } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchOrders();

    if (socket) {
      // 🚀 1. Listen for real-time ORDER status changes (Tailor accepts/completes)
      const handleStatusUpdate = (data: {
        orderId: number;
        status: string;
      }) => {
        console.log("Order status updated!", data);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.order_id === data.orderId
              ? { ...order, order_status: data.status }
              : order,
          ),
        );
      };

      // 🚀 2. Listen for NEW orders placed so the list updates instantly
      const handleNewOrder = () => {
        console.log("New order placed! Refreshing customer list...");
        fetchOrders();
      };

      socket.on("orderStatusUpdated", handleStatusUpdate);
      socket.on("newOrderPlaced", handleNewOrder);

      return () => {
        socket.off("orderStatusUpdated", handleStatusUpdate);
        socket.off("newOrderPlaced", handleNewOrder);
      };
    }
  }, [socket, userId]);

  const fetchOrders = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/api/customer/${userId}/orders`);
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "All") return true;
    if (filter === "Accepted") return o.order_status === "accepted";
    if (filter === "Completed") return o.order_status === "completed";
    if (filter === "In Progress") return o.order_status === "pending"; // Adjusted: Pending usually means in progress until accepted/completed
    return true;
  });

  // Helper to render the Progress Bar
  const renderProgressBar = (status: string) => {
    // Determine active steps
    const isPlaced = true;
    const isAccepted = status === "accepted" || status === "completed";
    const isCompleted = status === "completed";

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={isPlaced ? "#10b981" : "#cbd5e1"}
          />
          <Text
            style={[
              styles.stepText,
              { color: isPlaced ? "#10b981" : "#94a3b8" },
            ]}
          >
            Placed
          </Text>
        </View>
        <View
          style={[
            styles.progressLine,
            { backgroundColor: isAccepted ? "#10b981" : "#cbd5e1" },
          ]}
        />

        <View style={styles.progressStep}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={isAccepted ? "#3b82f6" : "#cbd5e1"}
          />
          <Text
            style={[
              styles.stepText,
              { color: isAccepted ? "#3b82f6" : "#94a3b8" },
            ]}
          >
            Accepted
          </Text>
        </View>
        <View
          style={[
            styles.progressLine,
            { backgroundColor: isCompleted ? "#3b82f6" : "#cbd5e1" },
          ]}
        />

        <View style={styles.progressStep}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={isCompleted ? "#f59e0b" : "#cbd5e1"}
          />
          <Text
            style={[
              styles.stepText,
              { color: isCompleted ? "#f59e0b" : "#94a3b8" },
            ]}
          >
            Completed
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TailorJunction</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={20}
            color="#3b82f6"
          />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.pageSubtitle}>
        Check all orders placed with tailors - in-shop visit process shown
        below:
      </Text>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {["Accepted", "In Progress", "Completed", "All"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.activeTab]}
            onPress={() => setFilter(tab)}
          >
            <MaterialCommunityIcons
              name={
                tab === "All" ? "format-list-bulleted" : "check-circle-outline"
              }
              size={14}
              color={filter === tab ? "#1e3a8a" : "gray"}
            />
            <Text
              style={[styles.tabText, filter === tab && styles.activeTabText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3b82f6"
            style={{ marginTop: 50 }}
          />
        ) : (
          filteredOrders.map((order) => (
            <View key={order.order_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image
                  source={{ uri: getImageUrl(order.profile_photo) }}
                  style={styles.avatar}
                />
                <View style={styles.infoBlock}>
                  <Text style={styles.tailorName}>{order.shop_name}</Text>
                  <Text style={styles.subText}>
                    ⭐ {order.tailor_rating} | 📍 {order.area}
                  </Text>
                  <Text style={styles.subText}>
                    Urgency: {order.urgency.replace("_", " ")}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {order.order_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {renderProgressBar(order.order_status)}

              <View
                style={{
                  flexDirection: "row",
                  borderTopWidth: 1,
                  borderColor: "#f1f5f9",
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity style={[styles.detailsBtn, { flex: 1 }]}>
                  <Text style={styles.detailsBtnText}>Details</Text>
                </TouchableOpacity>

                {/* 🚀 FIX: Removed the "completed" restriction. It now only hides if rejected */}
                {order.order_status !== "rejected" && (
                  <TouchableOpacity
                    style={[
                      styles.detailsBtn,
                      { flex: 1, borderLeftWidth: 1, borderColor: "#f1f5f9" },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/(customer)/Chat",
                        params: {
                          orderId: order.order_id,
                          receiverId: order.tailor_id,
                        },
                      })
                    }
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MaterialCommunityIcons
                        name="message-processing-outline"
                        size={16}
                        color="#3b82f6"
                      />
                      <Text style={[styles.detailsBtnText, { marginLeft: 5 }]}>
                        Chat
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1e3a8a" },
  filterBtn: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  filterBtnText: { color: "#3b82f6", fontWeight: "bold", marginLeft: 5 },
  pageSubtitle: { fontSize: 12, color: "gray", marginBottom: 15 },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeTab: { backgroundColor: "#e0f2fe", borderColor: "#3b82f6" },
  tabText: { fontSize: 12, marginLeft: 4, color: "gray" },
  activeTabText: { color: "#1e3a8a", fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  infoBlock: { flex: 1 },
  tailorName: { fontSize: 16, fontWeight: "bold", color: "#1e3a8a" },
  subText: { fontSize: 12, color: "gray", marginTop: 2 },
  statusBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 10, fontWeight: "bold", color: "#64748b" },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  progressStep: { alignItems: "center" },
  progressLine: { flex: 1, height: 2, marginHorizontal: 5 },
  stepText: { fontSize: 10, marginTop: 4, fontWeight: "bold" },
  detailsBtn: { alignItems: "center", justifyContent: "center" },
  detailsBtnText: { color: "#3b82f6", fontWeight: "bold" },
});
