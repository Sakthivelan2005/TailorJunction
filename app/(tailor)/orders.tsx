import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types/orders";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function OrdersScreen() {
  const { userId, API_URL } = useAuth();
  const [pending, setPending] = useState<Order[]>([]);
  const [completed, setCompleted] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [userId]);

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

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Orders</Text>

      <Text style={styles.sectionTitle}>Pending Orders</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Order ID</Text>
          <Text style={styles.col2}>Cloth Type</Text>
          <Text style={styles.col3}>Status</Text>
        </View>
        {pending.map((order) => (
          <View key={order.order_id} style={styles.tableRow}>
            <Text style={styles.col1}>{order.order_id}</Text>
            <Text style={styles.col2}>{order.cloth_type}</Text>
            <Text
              style={[
                styles.col3,
                { color: order.status === "accepted" ? "green" : "orange" },
              ]}
            >
              {order.status}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Completed Orders</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Order ID</Text>
          <Text style={styles.col2}>Cloth Type</Text>
          <Text style={styles.col4}>Feedback</Text>
          <Text style={styles.col5}>Rating</Text>
        </View>
        {completed.map((order) => (
          <View key={order.order_id} style={styles.tableRow}>
            <Text style={styles.col1}>{order.order_id}</Text>
            <Text style={styles.col2}>{order.cloth_type}</Text>
            <Text style={styles.col4} numberOfLines={1}>
              {order.feedback || "-"}
            </Text>
            <Text style={styles.col5}>
              {order.rating ? `${order.rating} ⭐` : "-"}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#555",
  },
  table: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  col1: { flex: 1, fontSize: 12 },
  col2: { flex: 1.5, fontSize: 12 },
  col3: { flex: 1, fontSize: 12, textAlign: "center" },
  col4: { flex: 2, fontSize: 12, color: "gray" },
  col5: { flex: 1, fontSize: 12, textAlign: "center" },
});
