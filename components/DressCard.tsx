import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DressCard({ dress, getImageUrl, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(dress)}
      activeOpacity={0.7}
    >
      {/* 1. Image Container (Fixed Width/Height so it never squishes) */}
      <View style={styles.imageContainer}>
        <Image
          source={getImageUrl(dress.dress_image)}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* 2. Text Container (flex: 1 is the magic bullet here) */}
      <View style={styles.detailsContainer}>
        <Text
          style={styles.titleText}
          numberOfLines={2}
          maxFontSizeMultiplier={1.2} // Prevents huge system fonts from breaking UI
        >
          {dress.dress_name}
        </Text>

        <Text style={styles.categoryText} maxFontSizeMultiplier={1.2}>
          {dress.category?.toUpperCase() || "ALL"}
        </Text>

        {/* Demand Indicator row */}
        <View style={styles.demandRow}>
          <MaterialCommunityIcons name="fire" size={16} color="#f59e0b" />
          <Text
            style={styles.demandText}
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
          >
            {`${Math.round(Math.random() * 100)}+ stitched recently`}
          </Text>
        </View>

        {/* Price Badge (Aligns to the left, wraps nicely) */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceLabel} maxFontSizeMultiplier={1.2}>
            From
          </Text>
          <Text style={styles.priceValue} maxFontSizeMultiplier={1.2}>
            ₹{Number(dress.base_price).toFixed(2)} Onwards
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    // flex: 1 tells React Native: "Take up exactly the remaining space, no more, no less"
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
    // Ensures text wraps to the next line instead of squeezing into a column
    flexWrap: "wrap",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  demandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  demandText: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "600",
    marginLeft: 4,
    flexShrink: 1, // Prevents long text from pushing off-screen
  },
  priceBadge: {
    backgroundColor: "#ecfdf5",
    alignSelf: "flex-start", // Prevents the badge from stretching full width
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: "#10b981",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
  },
});
