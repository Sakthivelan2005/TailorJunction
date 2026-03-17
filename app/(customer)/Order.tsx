// app/(customer)/Orders.tsx
import FunnyScrollView from "@/components/FunnyScrollView";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CustomerOrdersScreen() {
  const { userId, API_URL, socket } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({
    orderId: 0,
    tailorId: "",
    rating: 5,
    text: "",
  });

  // Cancellation Modal States
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelData, setCancelData] = useState({ orderId: 0, reason: "" });

  // Tracks which orders have unread messages
  const [unreadOrders, setUnreadOrders] = useState<number[]>([]);

  // Force UI re-render every minute for live countdown timers & expiration checks
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      setTick((t) => t + 1);
      checkExpiredChats(); // Check if any completed chats just expired
    }, 60000);

    if (socket && userId) {
      const handleStatusUpdate = () => {
        fetchOrders();
      };

      const handleNewMessage = (msgData: {
        order_id: number;
        receiver_id: string;
      }) => {
        if (msgData.receiver_id === userId) {
          setUnreadOrders((prev) =>
            Array.from(new Set([...prev, msgData.order_id])),
          );
        }
      };

      // Listen for backend chat deletion
      const handleChatClosed = () => {
        fetchOrders();
      };

      socket.on("orderStatusUpdated", handleStatusUpdate);
      socket.on("receiveMessage", handleNewMessage);
      socket.on("chatClosed", handleChatClosed);

      return () => {
        socket.off("orderStatusUpdated", handleStatusUpdate);
        socket.off("receiveMessage", handleNewMessage);
        socket.off("chatClosed", handleChatClosed);
        clearInterval(timer);
      };
    }
    return () => clearInterval(timer);
  }, [socket, userId, completed]);

  const fetchOrders = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/customer/${userId}/orders`);
      const result = await response.json();
      if (response.ok || result.success) {
        setPending(result.pendingOrders || []);
        setCompleted(result.completedOrders || []);
      }
    } catch (error) {
      console.error("Failed to fetch customer orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- REVIEW API CALL ---
  const submitFeedback = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/customer/orders/${reviewData.orderId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: userId,
            tailorId: reviewData.tailorId,
            rating: reviewData.rating,
            review_text: reviewData.text,
          }),
        },
      );
      const result = await res.json();
      if (result.success) {
        setReviewModalVisible(false);
        fetchOrders(); // Refresh the list
      }
    } catch (error) {
      console.error(error);
    }
  };

  // --- CANCEL ORDER API CALL ---
  const handleCancelOrder = async () => {
    if (!cancelData.reason.trim()) {
      showToast("Please provide a reason for cancellation.", "warning");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/customer/orders/${cancelData.orderId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: userId,
            reason: cancelData.reason,
          }),
        },
      );
      const data = await res.json();

      if (data.success) {
        showToast(data.message, "success");
        setCancelModalVisible(false);
        fetchOrders();
      } else {
        //Catches the exact Error Message from your MySQL Trigger (State 45000)
        showToast("Cancellation Failed", data.message || data.error);
      }
    } catch (error) {
      showToast("Network error. Try again.", "error");
    }
  };

  // --- HELPERS ---
  const canStillChat = (orderDatetime: string) => {
    const completedTime = new Date(orderDatetime).getTime();
    const now = new Date().getTime();
    const hoursPassed = (now - completedTime) / (1000 * 60 * 60);
    return hoursPassed < 24;
  };

  const checkExpiredChats = () => {
    completed.forEach((order) => {
      if (!canStillChat(order.completed_at || order.order_datetime)) {
        socket?.emit("deleteExpiredChat", { orderId: order.order_id });
      }
    });
  };

  // FRONTEND 3-HOUR CHECK (Matches DB Trigger)
  const isWithinCancelWindow = (orderDatetime: string) => {
    const orderTime = new Date(orderDatetime).getTime();
    const now = new Date().getTime();
    const hoursElapsed = (now - orderTime) / (1000 * 60 * 60);
    return hoursElapsed <= 3;
  };

  const getUrgencyTimer = (orderDatetime: string, urgency: string) => {
    if (urgency === "normal")
      return { text: "Normal Delivery", color: "#166534", bg: "#dcfce7" };

    const createdDate = new Date(orderDatetime).getTime();
    let hoursToAdd = 0;

    if (urgency === "1_day") hoursToAdd = 24;
    if (urgency === "2_day") hoursToAdd = 48;
    if (urgency === "3_day") hoursToAdd = 72;

    const deadline = createdDate + hoursToAdd * 60 * 60 * 1000;
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) return { text: "OVERDUE", color: "#fff", bg: "#ef4444" };

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const d = Math.floor(h / 24);
    const hrRem = h % 24;

    let text = d > 0 ? `${d}d ${hrRem}h ${m}m left` : `${h}h ${m}m left`;
    const isCritical = diff < 24 * 60 * 60 * 1000;

    return {
      text,
      color: isCritical ? "#ef4444" : "#ea580c",
      bg: isCritical ? "#fee2e2" : "#ffedd5",
    };
  };

  const openChat = (orderId: number, tailorId: string) => {
    setUnreadOrders((prev) => prev.filter((id) => id !== orderId));
    router.push({
      pathname: "/(customer)/Chat",
      params: { orderId, receiverId: tailorId },
    });
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );
  }

  return (
    <FunnyScrollView
      onRefreshData={fetchOrders}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>My Bookings</Text>

      {/* ACTIVE ORDERS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeText}>{pending.length}</Text>
        </View>
      </View>

      {pending.length === 0 ? (
        <Text style={styles.emptyText}>You have no active bookings.</Text>
      ) : null}

      {pending.map((order) => {
        const timer = getUrgencyTimer(order.order_datetime, order.urgency);
        const canCancel = isWithinCancelWindow(order.order_datetime);

        return (
          <View key={order.order_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>Order #{order.order_id}</Text>
                <Text style={styles.shopName}>
                  {order.shop_name || "Waiting for Tailor..."}
                </Text>
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
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.timerBadge,
                { backgroundColor: timer.bg, marginBottom: 15 },
              ]}
            >
              <Text style={[styles.timerText, { color: timer.color }]}>
                ⏱ {timer.text}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.clothText}>👗 {order.cloth_type}</Text>
              <Text style={styles.priceText}>₹{order.price}</Text>
            </View>

            <View style={styles.actionToolbar}>
              {order.status === "accepted" && order.tailor_id ? (
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => openChat(order.order_id, order.tailor_id)}
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
                  <Text style={styles.toolBtnText}>Message Tailor</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.waitingText}>
                  Finding the best tailor for you...
                </Text>
              )}

              {/* THE CANCELLATION BUTTON AREA */}
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {canCancel ? (
                  <TouchableOpacity
                    style={styles.cancelOrderBtn}
                    onPress={() => {
                      setCancelData({ orderId: order.order_id, reason: "" });
                      setCancelModalVisible(true);
                    }}
                  >
                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timeLockedText}>Cancellation locked</Text>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {/* COMPLETED ORDERS */}
      <View style={[styles.sectionHeader, { marginTop: 30 }]}>
        <Text style={styles.sectionTitle}>Past Orders</Text>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeText}>{completed.length}</Text>
        </View>
      </View>

      {completed.length === 0 ? (
        <Text style={styles.emptyText}>No completed orders yet.</Text>
      ) : null}

      {completed.map((order) => {
        const timestampToCheck = order.completed_at || order.order_datetime;
        const isChatOpen = canStillChat(timestampToCheck);

        return (
          <View
            key={order.order_id}
            style={[styles.card, styles.completedCard]}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderId}>Order #{order.order_id}</Text>
                <Text style={styles.shopName}>{order.shop_name}</Text>
              </View>
              {order.rating ? (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingText}>
                    {parseFloat(order.rating).toFixed(1)}
                  </Text>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#f59e0b"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    setReviewData({
                      orderId: order.order_id,
                      tailorId: order.tailor_id,
                      rating: 5,
                      text: "",
                    });
                    setReviewModalVisible(true);
                  }}
                >
                  <Text style={styles.reviewBtnText}>Leave Review</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.clothText}>✅ {order.cloth_type}</Text>
              <Text style={styles.priceText}>₹{order.price}</Text>
            </View>

            {/* CONDITIONAL CHAT RENDER LOGIC */}
            {isChatOpen && order.tailor_id ? (
              <View
                style={[styles.actionToolbar, { marginTop: 5, paddingTop: 10 }]}
              >
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => openChat(order.order_id, order.tailor_id)}
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
                  <Text style={styles.toolBtnText}>
                    Message Tailor (Closes soon)
                  </Text>
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

      {/* REVIEW MODAL */}
      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate your Tailor</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginVertical: 20,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewData({ ...reviewData, rating: star })}
                >
                  <MaterialCommunityIcons
                    name="star"
                    size={40}
                    color={star <= reviewData.rating ? "#f59e0b" : "#e2e8f0"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Write your feedback here..."
              placeholderTextColor="#94a3b8"
              value={reviewData.text}
              onChangeText={(txt: string) =>
                setReviewData({ ...reviewData, text: txt })
              }
              multiline
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
              <Text style={styles.confirmText}>Submit Feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setReviewModalVisible(false)}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CANCELLATION MODAL */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={40}
              color="#ef4444"
              style={{ alignSelf: "center", marginBottom: 10 }}
            />
            <Text style={styles.modalTitle}>Cancel Order?</Text>
            <Text style={styles.modalSubtitle}>
              You are within the 3-hour window. Refunds will be processed
              automatically.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Reason for cancellation..."
              placeholderTextColor="#94a3b8"
              value={cancelData.reason}
              onChangeText={(txt) =>
                setCancelData({ ...cancelData, reason: txt })
              }
              multiline
            />

            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={handleCancelOrder}
            >
              <Text style={styles.confirmText}>Confirm Cancellation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCancelModalVisible(false)}
            >
              <Text style={styles.cancelText}>Keep Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    marginBottom: 8,
  },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  shopName: { fontSize: 13, color: "#64748b", marginTop: 2 },

  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  timerText: { fontSize: 12, fontWeight: "bold" },

  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "bold" },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clothText: { fontSize: 15, color: "#475569", fontWeight: "500" },
  priceText: { fontSize: 16, fontWeight: "bold", color: "#10b981" },

  actionToolbar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 16,
  },
  toolBtn: { flexDirection: "row", alignItems: "center" },
  iconCircleSky: {
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 20,
    marginRight: 6,
  },
  toolBtnText: { fontSize: 14, fontWeight: "600", color: "#0284c7" },

  waitingText: {
    fontSize: 13,
    color: "#d97706",
    fontStyle: "italic",
    fontWeight: "500",
  },
  chatClosedText: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },

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

  // Cancellation Styles
  cancelOrderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  cancelOrderBtnText: { fontSize: 13, fontWeight: "bold", color: "#ef4444" },
  timeLockedText: { fontSize: 11, fontStyle: "italic", color: "#94a3b8" },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 15,
    height: 100,
    textAlignVertical: "top",
    color: "#000",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitBtn: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerBtn: {
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    padding: 15,
    alignItems: "center",
    marginTop: 5,
  },
  cancelText: {
    color: "#64748b",
    fontWeight: "bold",
    fontSize: 15,
  },
  feedbackText: { fontSize: 13, color: "#475569", fontStyle: "italic" },
  reviewBtn: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  reviewBtnText: { fontSize: 12, fontWeight: "bold", color: "#d97706" },
});
