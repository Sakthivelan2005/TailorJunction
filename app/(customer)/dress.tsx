// app/(customer)/dresses.tsx
import DressCard from "@/components/DressCard";
import { Images } from "@/config/Images";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllDressesScreen() {
  const { API_URL } = useAuth();

  const [dresses, setDresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "All" | "men" | "women" | "kids"
  >("All");

  useEffect(() => {
    fetchDresses();
  }, []);

  const fetchDresses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dress-types`);
      const data = await res.json();
      if (data.success) {
        setDresses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dresses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Safe Image URL parser
  const getImageSource = (path: string | null) => {
    if (!path) return Images.placeholder;
    return {
      uri: `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`,
    };
  };

  // HIGH PERFORMANCE FILTERING (useMemo prevents lag while typing)
  const filteredDresses = useMemo(() => {
    return dresses.filter((dress) => {
      const matchesSearch = dress.dress_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || dress.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dresses, searchQuery, activeCategory]);

  // Navigate to Tailors screen and pass the selected dress name to auto-filter!
  const handleDressClick = (dress: any) => {
    router.push({
      pathname: "/(customer)/tailors",
      params: { dressId: dress.dress_id },
    });
  };

  const renderCategoryChip = (label: string, value: any) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        activeCategory === value && styles.categoryChipActive,
      ]}
      onPress={() => setActiveCategory(value)}
    >
      <Text
        style={[
          styles.categoryText,
          activeCategory === value && styles.categoryTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Designs</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a dress..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY FILTERS */}
      <View style={styles.filterRow}>
        {renderCategoryChip("All", "All")}
        {renderCategoryChip("Women", "women")}
        {renderCategoryChip("Men", "men")}
        {renderCategoryChip("Kids", "kids")}
      </View>

      {/* DRESS LIST */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loaderText}>Loading the latest styles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDresses}
          keyExtractor={(item) => item.dress_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8} // Memory optimization for 2GB RAM
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="hanger" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                No dresses found matching your search.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            // REUSING OUR DRY COMPONENT!
            <DressCard
              dress={item}
              getImageUrl={getImageSource}
              onPress={handleDressClick}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e293b" },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  categoryChipActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  categoryText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  categoryTextActive: { color: "#fff" },

  listContent: { paddingHorizontal: 15, paddingBottom: 40 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, color: "#64748b", fontWeight: "500" },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#94a3b8", marginTop: 10, fontSize: 15 },
});
