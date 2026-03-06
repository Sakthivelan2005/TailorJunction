import { useAuth } from "@/context/AuthContext";
import { pushNotification } from "@/utils/notificationConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TailorOrdersScreen() {
  const { userId, API_URL, socket } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 Tracks which orders have unread messages
  const [unreadOrders, setUnreadOrders] = useState<number[]>([]);

  useEffect(() => {
    fetchOrders();

    if (socket && userId) {
      // 🚀 Listen for New Orders instantly
      const handleNewOrder = (data: { tailorId: string }) => {
        if (data.tailorId === userId) {
          pushNotification(
            "New Order Received",
            "You have a new order. Check it out!",
          );
          fetchOrders(); // Refresh the list silently in the background
        }
      };

      // 🚀 Listen for New Chat Messages
      const handleNewMessage = (msgData: {
        order_id: number;
        receiver_id: string;
      }) => {
        if (msgData.receiver_id === userId) {
          // Add this order ID to the unread list (preventing duplicates)
          setUnreadOrders((prev) =>
            Array.from(new Set([...prev, msgData.order_id])),
          );
        }
      };

      socket.on("newOrderPlaced", handleNewOrder);
      socket.on("receiveMessage", handleNewMessage);

      return () => {
        socket.off("newOrderPlaced", handleNewOrder);
        socket.off("receiveMessage", handleNewMessage);
      };
    }
  }, [socket, userId]);

  const fetchOrders = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/tailor/${userId}/orders`);
      const result = await response.json();
      if (response.ok) {
        setPending(result.pendingOrders);
        setCompleted(result.completedOrders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ACTION: Update Order Status
  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(
        `${API_URL}/api/tailor/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();

      if (data.success) {
        fetchOrders(); // Refresh the list so it moves to the right section
      } else {
        Alert.alert("Error", "Failed to update order status.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error updating order.");
    }
  };

  // 🚀 NAVIGATION: Open Chat
  const openChat = (orderId: number, customerId: string) => {
    // Remove the "New" badge when opened
    setUnreadOrders((prev) => prev.filter((id) => id !== orderId));

    router.push({
      pathname: "/(tailor)/Chat",
      params: { orderId, receiverId: customerId },
    });
  };

  // 🚀 NAVIGATION: Open Measurements
  const openMeasurements = (orderId: number) => {
    router.push({
      pathname: "/(tailor)/Measurements",
      params: { orderId },
    });
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>Shop Orders</Text>

      {/* PENDING & ACCEPTED ORDERS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeText}>{pending.length}</Text>
        </View>
      </View>

      {pending.length === 0 ? (
        <Text style={styles.emptyText}>No active orders right now.</Text>
      ) : null}

      {pending.map((order) => (
        <View key={order.order_id} style={styles.card}>
          {/* Card Top: ID & Status */}
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Order #{order.order_id}</Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    order.status === "accepted" ? "#dcfce7" : "#fef3c7",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: order.status === "accepted" ? "#166534" : "#92400e",
                  },
                ]}
              >
                {order.status === "pending" ? "Pending" : "In Progress"}
              </Text>
            </View>
          </View>

          {/* Card Body: Cloth Details */}
          <Text style={styles.clothText}>👗 {order.cloth_type}</Text>

          {/* Card Bottom: Actions Toolbar */}
          <View style={styles.actionToolbar}>
            {/* Measurement Button */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => openMeasurements(order.order_id)}
            >
              <View style={styles.iconCircleBlue}>
                <MaterialCommunityIcons
                  name="tape-measure"
                  size={18}
                  color="#3b82f6"
                />
              </View>
              <Text style={styles.toolBtnText}>Measure</Text>
            </TouchableOpacity>

            {/* Chat Button */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => openChat(order.order_id, order.customer_id)}
            >
              <View>
                <View style={styles.iconCircleSky}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={18}
                    color="#0284c7"
                  />
                </View>

                {/* 🚀 The Red Notification Label */}
                {unreadOrders.includes(order.order_id) && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.toolBtnText}>Chat</Text>
            </TouchableOpacity>

            {/* Status Update Button */}
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              {order.status === "pending" ? (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => updateStatus(order.order_id, "accepted")}
                >
                  <Text style={styles.primaryBtnText}>Accept Order</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => updateStatus(order.order_id, "completed")}
                >
                  <Text style={styles.primaryBtnText}>Complete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}

      {/* COMPLETED ORDERS */}
      <View style={[styles.sectionHeader, { marginTop: 30 }]}>
        <Text style={styles.sectionTitle}>Completed Orders</Text>
      </View>

      {completed.length === 0 ? (
        <Text style={styles.emptyText}>No completed orders.</Text>
      ) : null}

      {completed.map((order) => (
        <View key={order.order_id} style={[styles.card, styles.completedCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Order #{order.order_id}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>
                {order.rating ? parseFloat(order.rating).toFixed(1) : "N/A"}
              </Text>
              {order.rating && (
                <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
              )}
            </View>
          </View>

          <Text style={styles.clothText}>✅ {order.cloth_type}</Text>

          {order.feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>"{order.feedback}"</Text>
            </View>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
    paddingTop: 60,
  },
  loader: { flex: 1, justifyContent: "center" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#334155" },
  badgeCount: {
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "bold", color: "#475569" },

  emptyText: { color: "#94a3b8", fontStyle: "italic", marginBottom: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  completedCard: {
    opacity: 0.85,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 0,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "bold" },

  clothText: { fontSize: 15, color: "#475569", marginBottom: 16 },

  actionToolbar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 16,
  },
  toolBtn: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  iconCircleBlue: {
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 20,
    marginRight: 6,
  },
  iconCircleSky: {
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 20,
    marginRight: 6,
  },
  toolBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },

  acceptBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  completeBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },

  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginRight: 4,
  },
  feedbackBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  feedbackText: { fontSize: 13, color: "#475569", fontStyle: "italic" },

  // Notification Badge Styles
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: 0,
    backgroundColor: "#ef4444",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    elevation: 3,
  },
  unreadText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
});
