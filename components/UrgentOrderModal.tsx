// components/UrgentOrderModal.tsx
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { pushNotification } from "@/utils/notificationConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function UrgentOrderModal() {
  const { userId, socket, API_URL } = useAuth();
  const { showToast } = useToast();

  const [orderData, setOrderData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!socket || !userId) return;

    // 🚀 1. Listen for Incoming Urgent Orders
    const handleIncoming = (data: any) => {
      console.log("Urgent Order Received:", data);
      setOrderData(data);
      pushNotification(
        "Urgent Order Alert!",
        `New urgent order: ${data.dress_name} for ₹${data.total_price}`,
      );
      setTimeLeft(60);
    };

    // 🚀 2. Listen if another tailor accepted it first!
    const handleClose = (data: { orderId: string }) => {
      if (orderData && orderData.orderId === data.orderId) {
        setOrderData(null);
        showToast("Order was grabbed by another tailor!", "warning");
      }
    };

    socket.on("incomingUrgentOrder", handleIncoming);
    socket.on("closeUrgentPopup", handleClose);

    return () => {
      socket.off("incomingUrgentOrder", handleIncoming);
      socket.off("closeUrgentPopup", handleClose);
    };
  }, [socket, userId, orderData]);

  // Timer Countdown Logic
  useEffect(() => {
    if (!orderData) return;

    if (timeLeft <= 0) {
      setOrderData(null); // Close modal on timeout
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [orderData, timeLeft]);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      // 1. Fetch this tailor's specific shop details to send back to the customer
      const res = await fetch(`${API_URL}/api/tailor/${userId}/profile`);
      const profile = await res.json();

      const shopName = profile.details?.shop_name || "TailorJunction Shop";
      const mapLink = profile.details?.map_link || "";

      console.log("socket emitting acceptUrgentOrder with data:", profile);
      // 2. Tell the server we accepted it!
      socket?.emit("acceptUrgentOrder", {
        orderId: orderData.orderId,
        tailorId: userId,
        customerId: orderData.customerId,
        shop_name: shopName,
        map_link: mapLink,
        urgency: orderData.urgency,
        measurement_type: orderData.measurement_type,
        dress_id: orderData.dress_id,
        dress_image: orderData.dress_image,
        total_price: orderData.total_price,
      });

      showToast("You accepted the urgent order!", "success");
      setOrderData(null);
    } catch (error) {
      showToast("Error accepting order. Try again.", "error");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = () => {
    setOrderData(null); // Just close the modal locally
  };

  if (!orderData) return null;

  return (
    <Modal visible={!!orderData} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={28}
              color="#f59e0b"
            />
            <Text style={styles.title}>FAST SERVICE ALERT!</Text>
          </View>

          <Text style={styles.orderId}>ID: {orderData.orderId}</Text>

          <View style={styles.detailsBox}>
            <Text style={styles.detailText}>
              👗 <Text style={styles.bold}>{orderData.dress_name}</Text> (
              {orderData.category})
            </Text>
            <Text style={styles.detailText}>
              ⏱ Urgency:{" "}
              <Text style={styles.bold}>
                {orderData.urgency.replace("_", " ")}
              </Text>
            </Text>
            <Text style={styles.detailText}>
              💰 Earn:{" "}
              <Text style={styles.earning}>₹{orderData.total_price}</Text>
            </Text>
          </View>

          <Text style={styles.timerText}>
            Time remaining:{" "}
            <Text style={timeLeft <= 10 ? styles.redText : undefined}>
              {timeLeft}s
            </Text>
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={handleReject}
              disabled={isAccepting}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAccept}
              disabled={isAccepting}
            >
              <Text style={styles.acceptText}>
                {isAccepting ? "Accepting..." : "ACCEPT ORDER"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "#d97706", marginLeft: 8 },
  orderId: {
    textAlign: "center",
    color: "gray",
    fontSize: 12,
    marginBottom: 15,
  },
  detailsBox: {
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailText: { fontSize: 16, marginBottom: 8, color: "#334155" },
  bold: { fontWeight: "bold", color: "#1e293b" },
  earning: { fontWeight: "bold", color: "#10b981", fontSize: 18 },
  timerText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#475569",
  },
  redText: { color: "#ef4444", fontSize: 18 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  rejectBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    alignItems: "center",
  },
  rejectText: { color: "#64748b", fontWeight: "bold", fontSize: 16 },
  acceptBtn: {
    flex: 2,
    padding: 15,
    backgroundColor: "#10b981",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
