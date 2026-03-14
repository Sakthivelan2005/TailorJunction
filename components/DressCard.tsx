// components/DressCard.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DressCardProps {
  dress: any;
  onPress: (dress: any) => void;
  getImageUrl: (path: string | null) => any;
}

export default function DressCard({
  dress,
  onPress,
  getImageUrl,
}: DressCardProps) {
  // Using dress_id to generate a consistent "mock" metric so it doesn't change on re-renders
  const popularityScore = ((dress.dress_id * 17) % 200) + 50;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(dress)}>
      <Image source={getImageUrl(dress.dress_image)} style={styles.image} />

      <View style={styles.infoBox}>
        <Text style={styles.title}>{dress.dress_name}</Text>
        <Text style={styles.category}>{dress.category.toUpperCase()}</Text>

        {/* Added Metrics */}
        <View style={styles.metricRow}>
          <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
          <Text style={styles.metricText}>
            {popularityScore}+ stitched recently
          </Text>
        </View>
      </View>

      <View style={styles.priceBadge}>
        <Text style={styles.priceLabel}>From</Text>
        <Text style={styles.priceValue}>₹{dress.base_price} Onwards</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  infoBox: { flex: 1, marginLeft: 15 },
  title: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  category: { fontSize: 11, color: "#64748b", marginTop: 2, fontWeight: "600" },
  metricRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  metricText: {
    fontSize: 12,
    color: "#f59e0b",
    marginLeft: 4,
    fontWeight: "500",
  },
  priceBadge: {
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 10,
    alignItems: "flex-end",
  },
  priceLabel: { fontSize: 10, color: "#10b981", fontWeight: "bold" },
  priceValue: { fontSize: 16, color: "#059669", fontWeight: "bold" },
});
