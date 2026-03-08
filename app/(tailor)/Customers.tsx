// app/(tailor)/Customers.tsx
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface CustomerMetric {
  customer_id: string;
  customer_name: string;
  area: string;
  phone: string;
  total_orders: number;
  total_spent: string;
  last_order_date: string;
  stitched_dresses: string;
}

export default function TailorCustomersScreen() {
  const { userId, API_URL } = useAuth();
  const [customers, setCustomers] = useState<CustomerMetric[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `${API_URL}/api/tailor/${userId}/customers`,
        );
        console.log("response: ", response);
        const result = await response.json();
        console.log("Result: ", result);
        if (result.success) {
          setCustomers(result.customers);
          setGrandTotal(result.grandTotal);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [userId]);

  if (loading) {
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Client Book</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {customers.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven't completed any orders yet.
          </Text>
        ) : (
          customers.map((cust, index) => {
            // Because SQL orders by total_spent DESC, index 0 is the highest paying customer!
            const isTopClient = index === 0;

            return (
              <View
                key={cust.customer_id}
                style={[styles.card, isTopClient && styles.topClientCard]}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.customerName}>
                      {cust.customer_name || "Guest User"}
                      {isTopClient && " 👑"}
                    </Text>
                    <Text style={styles.subText}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={12}
                      />{" "}
                      {cust.area || "Unknown Area"}
                    </Text>
                  </View>
                  <View style={styles.revenueBadge}>
                    <Text style={styles.revenueText}>₹{cust.total_spent}</Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailLabel}>Dresses Stitched:</Text>
                  <Text style={styles.detailValue}>
                    {cust.stitched_dresses}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Total Orders: {cust.total_orders}
                    </Text>
                    <Text style={styles.metaText}>
                      Last order:{" "}
                      {new Date(cust.last_order_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 🚀 GRAND TOTAL EARNED (AT THE BOTTOM AS REQUESTED) */}
      <View style={styles.footerBanner}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total Lifetime Earnings</Text>
            <Text style={styles.footerSub}>
              From {customers.length} unique customers
            </Text>
          </View>
          <Text style={styles.footerAmount}>
            ₹{grandTotal.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingTop: 60 },
  loader: { flex: 1, justifyContent: "center" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 40,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  topClientCard: {
    borderColor: "#f59e0b",
    borderWidth: 2,
    backgroundColor: "#fffbeb", // Light amber background
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  subText: { fontSize: 13, color: "#64748b", marginTop: 4 },

  revenueBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  revenueText: { color: "#166534", fontWeight: "bold", fontSize: 16 },

  detailsBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#cbd5e1",
    paddingTop: 8,
  },
  metaText: { fontSize: 11, color: "#64748b", fontWeight: "500" },

  footerBanner: {
    backgroundColor: "#1e3a8a",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: { color: "#bfdbfe", fontSize: 14, fontWeight: "600" },
  footerSub: { color: "#93c5fd", fontSize: 11, marginTop: 2 },
  footerAmount: { color: "#fff", fontSize: 28, fontWeight: "bold" },
});
