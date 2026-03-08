// app/(customer)/MyTailors.tsx
import FunnyScrollView from "@/components/FunnyScrollView";
import { useAuth } from "@/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface TailorMetric {
  tailor_id: string;
  shop_name: string;
  tailor_name: string;
  profile_photo: string;
  availability_status: string;
  total_orders: number;
  total_spent: string;
  last_order_date: string;
}

export default function MyTailorsScreen() {
  const { userId, API_URL } = useAuth();
  const [tailors, setTailors] = useState<TailorMetric[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTailors();
  }, [userId]);

  const fetchMyTailors = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/customer/${userId}/my-tailors`,
      );
      const result = await response.json();
      if (result.success) {
        setTailors(result.tailors);
        setGrandTotal(result.grandTotal);
      }
    } catch (error) {
      console.error("Failed to fetch my tailors:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Tailors</Text>

      <FunnyScrollView
        onRefreshData={fetchMyTailors}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {tailors.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven't completed any orders yet. Start exploring!
          </Text>
        ) : (
          tailors.map((tailor, index) => {
            // Index 0 is the tailor they have spent the most money with
            const isGoToTailor = index === 0;

            return (
              <View
                key={tailor.tailor_id}
                style={[styles.card, isGoToTailor && styles.topTailorCard]}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.profileRow}>
                    <Image
                      source={{ uri: getImageUrl(tailor.profile_photo) }}
                      style={styles.avatar}
                    />
                    <View>
                      <Text style={styles.shopName}>
                        {tailor.shop_name}
                        {isGoToTailor && " 🧵"}
                      </Text>
                      <Text style={styles.subText}>
                        by {tailor.tailor_name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.spentBadge}>
                    <Text style={styles.spentText}>₹{tailor.total_spent}</Text>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.detailsBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      Total Orders: {tailor.total_orders}
                    </Text>
                    <Text style={styles.metaText}>
                      Last order:{" "}
                      {new Date(tailor.last_order_date).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Action Toolbar */}
                  <View style={styles.actionRow}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              tailor.availability_status === "available"
                                ? "#10b981"
                                : "#ef4444",
                          },
                        ]}
                      />
                      <Text style={styles.statusText}>
                        {tailor.availability_status === "available"
                          ? "Available Now"
                          : "Currently Busy"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.visitBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/(customer)/TailorDetails",
                          params: { tailorId: tailor.tailor_id },
                        })
                      }
                    >
                      <Text style={styles.visitBtnText}>Visit Shop</Text>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={16}
                        color="#fff"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </FunnyScrollView>

      {/* 🚀 GRAND TOTAL SPENT (AT THE BOTTOM) */}
      <View style={styles.footerBanner}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total Wardrobe Investment</Text>
            <Text style={styles.footerSub}>
              Across {tailors.length} trusted tailors
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
    paddingHorizontal: 20,
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
  topTailorCard: {
    borderColor: "#3b82f6", // Blue outline for the favorite tailor
    borderWidth: 2,
    backgroundColor: "#eff6ff", // Light blue background
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  profileRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    backgroundColor: "#e2e8f0",
  },
  shopName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  subText: { fontSize: 12, color: "#64748b", marginTop: 2 },

  spentBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  spentText: { color: "#334155", fontWeight: "bold", fontSize: 14 },

  detailsBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "500" },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingTop: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#475569" },

  visitBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  visitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  footerBanner: {
    backgroundColor: "#0f172a",
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
  footerLabel: { color: "#cbd5e1", fontSize: 14, fontWeight: "600" },
  footerSub: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  footerAmount: { color: "#10b981", fontSize: 28, fontWeight: "bold" },
});
