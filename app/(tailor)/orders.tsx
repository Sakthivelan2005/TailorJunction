// app/(tailor)/Orders.tsx
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
// 1. Import the notification helper
import FunnyScrollView from "@/components/FunnyScrollView";
import { pushNotification } from "@/utils/notificationConfig";

export default function TailorOrdersScreen() {
  const { userId, API_URL, socket } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [unreadOrders, setUnreadOrders] = useState<number[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      setTick((t) => t + 1);
      checkExpiredChats();
    }, 60000);

    if (socket && userId) {
      socket.on("newOrderPlaced", (data: { tailorId: string }) => {
        if (data.tailorId === userId) fetchOrders();
      });

      // 2. Listen for order status changes (Specifically Cancellations)
      socket.on(
        "orderStatusUpdated",
        (data: {
          orderId: number;
          status: string;
          tailorId: string;
          reason?: string;
        }) => {
          if (data.tailorId === userId) {
            if (data.status === "cancelled") {
              // A. Trigger the Local Push Notification
              pushNotification(
                "Order Cancelled!",
                `Order #${data.orderId} was cancelled. Reason: ${data.reason || "Not provided"}`,
              );

              // B. Instantly remove it from the UI for a snappy experience
              setPending((prev) =>
                prev.filter((order) => order.order_id !== data.orderId),
              );
            }

            // C. Re-sync with the database just to be safe
            fetchOrders();
          }
        },
      );

      socket.on(
        "receiveMessage",
        (msgData: { order_id: number; receiver_id: string }) => {
          if (msgData.receiver_id === userId) {
            setUnreadOrders((prev) =>
              Array.from(new Set([...prev, msgData.order_id])),
            );
          }
        },
      );

      socket.on("chatClosed", () => fetchOrders());
      socket.on("newReview", (data) => {
        if (data.tailorId === userId) fetchOrders();
      });

      return () => {
        socket.off("newOrderPlaced");
        socket.off("orderStatusUpdated"); // Clean up listener
        socket.off("receiveMessage");
        socket.off("chatClosed");
        socket.off("newReview");
        clearInterval(timer);
      };
    }
    return () => clearInterval(timer);
  }, [socket, userId, completed]);

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

  const canStillChat = (orderDatetime: string) => {
    const completedTime = new Date(orderDatetime).getTime();
    return (new Date().getTime() - completedTime) / (1000 * 60 * 60) < 24;
  };

  const checkExpiredChats = () => {
    completed.forEach((order) => {
      if (!canStillChat(order.completed_at || order.order_datetime)) {
        socket?.emit("deleteExpiredChat", { orderId: order.order_id });
      }
    });
  };

  const getUrgencyTimer = (orderDatetime: string, urgency: string) => {
    if (urgency === "normal")
      return { text: "Normal Delivery", color: "#10b981", bg: "#dcfce7" };

    const createdDate = new Date(orderDatetime).getTime();
    let hoursToAdd = urgency === "1_day" ? 24 : urgency === "2_day" ? 48 : 72;
    const diff =
      createdDate + hoursToAdd * 60 * 60 * 1000 - new Date().getTime();

    if (diff <= 0) return { text: "OVERDUE", color: "#fff", bg: "#ef4444" };

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let text =
      h > 24
        ? `${Math.floor(h / 24)}d ${h % 24}h ${m}m left`
        : `${h}h ${m}m left`;

    return {
      text,
      color: diff < 24 * 60 * 60 * 1000 ? "#ef4444" : "#f59e0b",
      bg: diff < 24 * 60 * 60 * 1000 ? "#fee2e2" : "#fef3c7",
    };
  };

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
      if (data.success) fetchOrders();
    } catch (err) {
      Alert.alert("Error", "Network error updating order.");
    }
  };

  const openChat = (orderId: number, customerId: string) => {
    setUnreadOrders((prev) => prev.filter((id) => id !== orderId));
    router.push({
      pathname: "/(tailor)/Chat",
      params: { orderId, receiverId: customerId },
    });
  };

  if (loading)
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );

  return (
    <FunnyScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onRefreshData={fetchOrders}
    >
      <Text style={styles.headerTitle}>Shop Orders</Text>

      {/* ACTIVE ORDERS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeText}>{pending.length}</Text>
        </View>
      </View>

      {pending.length === 0 && (
        <Text style={styles.emptyText}>No active orders right now.</Text>
      )}

      {pending.map((order) => {
        const timer = getUrgencyTimer(order.order_datetime, order.urgency);

        return (
          <View key={order.order_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>Order #{order.order_id}</Text>
                <View
                  style={[styles.timerBadge, { backgroundColor: timer.bg }]}
                >
                  <Text style={[styles.timerText, { color: timer.color }]}>
                    ⏱ {timer.text}
                  </Text>
                </View>
              </View>

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
                      color:
                        order.status === "accepted" ? "#166534" : "#92400e",
                    },
                  ]}
                >
                  {order.status === "pending" ? "Pending" : "In Progress"}
                </Text>
              </View>
            </View>

            <Text style={styles.clothText}>👗 {order.cloth_type}</Text>

            <View style={styles.actionToolbar}>
              <TouchableOpacity
                style={styles.toolBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(tailor)/Measurements",
                    params: { orderId: order.order_id },
                  })
                }
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
                  {unreadOrders.includes(order.order_id) && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCountText}>New</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.toolBtnText}>Chat</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {order.status === "pending" ? (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => updateStatus(order.order_id, "accepted")}
                  >
                    <Text style={styles.primaryBtnText}>Accept</Text>
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
        );
      })}

      {/* COMPLETED ORDERS */}
      <View style={[styles.sectionHeader, { marginTop: 30 }]}>
        <Text style={styles.sectionTitle}>Completed Orders</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeText}>{completed.length}</Text>
        </View>
      </View>

      {completed.length === 0 && (
        <Text style={styles.emptyText}>No completed orders.</Text>
      )}

      {completed.map((order) => {
        const timestampToCheck = order.completed_at || order.order_datetime;
        const isChatOpen = canStillChat(timestampToCheck);

        return (
          <View
            key={order.order_id}
            style={[styles.card, styles.completedCard]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order #{order.order_id}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>
                  {order.rating ? parseFloat(order.rating).toFixed(1) : "N/A"}
                </Text>
                {order.rating && (
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#f59e0b"
                  />
                )}
              </View>
            </View>

            <Text style={styles.clothText}>✅ {order.cloth_type}</Text>

            {isChatOpen ? (
              <View
                style={[styles.actionToolbar, { marginTop: 5, paddingTop: 10 }]}
              >
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
                    {unreadOrders.includes(order.order_id) && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCountText}>New</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.toolBtnText}>Chat (Closes soon)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.actionToolbar,
                  {
                    marginTop: 5,
                    paddingTop: 10,
                    borderTopColor: "transparent",
                  },
                ]}
              >
                <Text style={styles.chatClosedText}>
                  Chat expired and securely deleted.
                </Text>
              </View>
            )}

            {order.feedback && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>"{order.feedback}"</Text>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </FunnyScrollView>
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  timerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  timerText: { fontSize: 11, fontWeight: "bold" },
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
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -2,
    backgroundColor: "#ef4444",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    elevation: 3,
  },
  unreadCountText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginRight: 4,
  },
  chatClosedText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  feedbackBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  feedbackText: { fontSize: 13, color: "#475569", fontStyle: "italic" },
});
