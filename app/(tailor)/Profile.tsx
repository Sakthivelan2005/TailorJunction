import FunnyScrollView from "@/components/FunnyScrollView";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface ProfileData {
  details: {
    tailor_name: string;
    shop_name: string;
    phone: string;
    email: string;
    profile_photo: string;
    house_no: string;
    street: string;
    area: string;
    district: string;
    pincode: string;
  };
  pricing: {
    dress_id: number;
    cloth_type: string;
    base_price: number;
    price: string;
    dress_image: string | null;
    updated_at?: string; // 🚀 Added timestamp from backend
  }[];
}

export default function ProfileScreen() {
  const { userId, API_URL, socket } = useAuth();
  const { showToast } = useToast(); // 🚀 Grab Toast Hook
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Pricing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<number, string>>({});

  // 🚀 Timer States
  const [nextEditTime, setNextEditTime] = useState<string | null>(null);
  const [canEditPrices, setCanEditPrices] = useState(true);

  // New Dress Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDress, setNewDress] = useState({
    name: "",
    category: "Men",
    price: "",
  });
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProfile();

    if (socket) {
      socket.on("catalogUpdated", (res) => {
        if (res.tailorId === userId) fetchProfile();
      });
      return () => {
        socket.off("catalogUpdated");
      };
    }
  }, [userId, socket]);

  // 🚀 Calculate the 24-hour countdown timer
  useEffect(() => {
    if (!data?.pricing || data.pricing.length === 0) return;

    // Find the most recent update time across all dresses
    let latestUpdate = 0;
    data.pricing.forEach((item) => {
      if (item.updated_at) {
        // 🚀 Ensure proper Date parsing regardless of timezone format
        const time = new Date(item.updated_at).getTime();
        if (time > latestUpdate) latestUpdate = time;
      }
    });

    // If no valid timestamps were found, allow editing immediately
    if (latestUpdate === 0) {
      setNextEditTime(null);
      setCanEditPrices(true);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const msIn24Hours = 24 * 60 * 60 * 1000;

      // How much time has passed since the last edit?
      const timePassed = now - latestUpdate;

      // 🚀 If LESS than 24 hours have passed, lock the button!
      if (timePassed < msIn24Hours && timePassed > 0) {
        const msLeft = msIn24Hours - timePassed;
        const hrs = Math.floor(msLeft / (1000 * 60 * 60));
        const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

        setNextEditTime(`${hrs}h ${mins}m`);
        setCanEditPrices(false);
      } else {
        // 🚀 24 hours have passed, unlock the button!
        setNextEditTime(null);
        setCanEditPrices(true);
      }
    };

    calculateTimeLeft(); // Run immediately
    const interval = setInterval(calculateTimeLeft, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [data]);

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/tailor/${userId}/profile`);
      const result = await response.json();
      if (response.ok) {
        setData(result);
        const initialEdits: Record<number, string> = {};
        result.pricing.forEach((item: any) => {
          initialEdits[item.dress_id] = item.price.toString();
        });
        setEditedPrices(initialEdits);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Handle Edit Button Click
  const handleEditClick = () => {
    if (!canEditPrices) {
      showToast(
        "Price cannot be updated within 24 hours of last update.",
        "warning",
      );
      return;
    }
    setIsEditing(true);
  };

  // --- SAVE EDITED PRICING ---
  const savePricingUpdates = async () => {
    setIsSubmitting(true);
    const updates = Object.keys(editedPrices).map((id) => ({
      dress_id: Number(id),
      new_price: editedPrices[Number(id)],
    }));

    try {
      const res = await fetch(`${API_URL}/api/tailor/${userId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricingUpdates: updates }),
      });
      const result = await res.json();

      if (result.success) {
        showToast("Pricing updated successfully!", "success");
        setIsEditing(false);
        fetchProfile(); // This will pull the new updated_at and restart the 24hr timer!
      } else {
        // 🚀 Catch the Trigger Error from backend
        showToast(result.message || "Failed to update prices.", "error");
      }
    } catch (error) {
      showToast("Network issue while saving.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PICK IMAGE ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setNewImage(result.assets[0].uri);
  };

  // --- ADD NEW DRESS ---
  const submitNewDress = async () => {
    if (!newDress.name || !newDress.price) {
      showToast("Please fill name and price.", "warning");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    // Append text data BEFORE the image!
    // Multer reads streams top-to-bottom. It needs this info first to build the folder path.
    formData.append("dress_name", newDress.name);
    formData.append("category", newDress.category);
    formData.append("price", newDress.price);

    if (newImage) {
      // The key here MUST match uploadDressImage.single("dressImage")
      formData.append("dressImage", {
        uri: newImage,
        name: "custom_dress.png", // Extension helps Multer determine type
        type: "image/png",
      } as any);
    }

    try {
      const res = await fetch(`${API_URL}/api/tailor/${userId}/custom-dress`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        showToast("New dress added to catalog!", "success");
        setNewDress({ name: "", category: "Men", price: "" });
        setNewImage(null);
        setShowAddForm(false);
        fetchProfile(); // Refresh table to show the new image instantly
      } else {
        showToast(result.message || "Failed to add dress.", "warning");
      }
    } catch (error) {
      showToast("Network issue uploading dress.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!data) return <Text style={styles.errorText}>Profile not found</Text>;

  const { details, pricing } = data;
  const address = `${details.house_no}, ${details.street}, ${details.area}, ${details.district} - ${details.pincode}`;

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  }; // Debug log for profile photo URL
  console.log("Dress Image URL:", pricing[0].dress_image); // Debug log for dress image URL

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <FunnyScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshData={fetchProfile}
      >
        <Text style={styles.headerTitle}>Shop Profile</Text>

        {/* PROFILE HEADER */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <Image
              source={{ uri: getImageUrl(details.profile_photo) }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.infoText}>
            Name: <Text style={styles.bold}>{details.tailor_name}</Text>
          </Text>
          <Text style={styles.infoText}>
            Shop: <Text style={styles.bold}>{details.shop_name}</Text>
          </Text>
          <Text style={styles.infoText}>
            Phone: <Text style={styles.bold}>{details.phone}</Text>
          </Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>

        {/* PRICING CATALOG */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Catalog & Pricing</Text>
              {/* 🚀 TIMER DISPLAY */}
              {!canEditPrices && nextEditTime && (
                <Text style={styles.timerText}>
                  Next Edit access: {nextEditTime}
                </Text>
              )}
            </View>

            {isEditing ? (
              <TouchableOpacity
                style={styles.actionBtnActive}
                onPress={savePricingUpdates}
                disabled={isSubmitting}
              >
                <Text style={styles.actionBtnTextW}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  !canEditPrices && styles.actionBtnDisabled,
                ]}
                onPress={handleEditClick}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    !canEditPrices && { color: "#94a3b8" },
                  ]}
                >
                  Edit Prices
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableColImg}>Image</Text>
            <Text style={styles.tableColLeft}>Dress Varieties</Text>
            <Text style={styles.tableColRight}>Price ₹</Text>
          </View>

          {pricing.map((item) => (
            <View key={item.dress_id} style={styles.tableRow}>
              <View style={styles.tableColImg}>
                <Image
                  source={{ uri: getImageUrl(item.dress_image) }}
                  style={styles.dressThumb}
                />
              </View>
              <View style={styles.tableColLeft}>
                <Text style={{ fontSize: 14 }}>{item.cloth_type}</Text>
                <Text style={styles.basePriceText}>
                  Base: ₹{item.base_price}
                </Text>
              </View>
              <View style={styles.tableColRight}>
                {isEditing ? (
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={editedPrices[item.dress_id]}
                    onChangeText={(val) =>
                      setEditedPrices({ ...editedPrices, [item.dress_id]: val })
                    }
                  />
                ) : (
                  <Text style={styles.priceText}>₹{item.price}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ADD NEW DRESS SECTION */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.sectionHeader}
          >
            <Text style={styles.sectionTitle}>+ Add Custom Dress</Text>
            <MaterialCommunityIcons
              name={showAddForm ? "chevron-up" : "chevron-down"}
              size={24}
              color="#334155"
            />
          </TouchableOpacity>

          {showAddForm && (
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {newImage ? (
                  <Image
                    source={{ uri: newImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons
                      name="camera-plus"
                      size={30}
                      color="#94a3b8"
                    />
                    <Text style={styles.placeholderText}>
                      Upload Dress Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Dress Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Designer Lehenga"
                value={newDress.name}
                onChangeText={(t) => setNewDress({ ...newDress, name: t })}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {["Men", "Women", "Kids", "Both"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catBtn,
                      newDress.category === cat && styles.catBtnActive,
                    ]}
                    onPress={() => setNewDress({ ...newDress, category: cat })}
                  >
                    <Text
                      style={[
                        styles.catText,
                        newDress.category === cat && styles.catTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Your Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={newDress.price}
                onChangeText={(t) => setNewDress({ ...newDress, price: t })}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitNewDress}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Add to Catalog</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </FunnyScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 15,
    paddingTop: 50,
  },
  loader: { flex: 1, justifyContent: "center" },
  errorText: { textAlign: "center", marginTop: 50 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  infoText: { fontSize: 14, marginBottom: 6, color: "#475569" },
  bold: { fontWeight: "bold", color: "#1e293b" },
  addressText: {
    fontSize: 13,
    color: "gray",
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },

  // 🚀 Timer text style
  timerText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "bold",
    marginTop: 2,
  },

  actionBtn: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionBtnActive: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 15,
  },
  actionBtnDisabled: { backgroundColor: "#f1f5f9" }, // Greyed out button
  actionBtnText: { color: "#0284c7", fontWeight: "bold", fontSize: 12 },
  actionBtnTextW: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  tableColImg: { width: 50, alignItems: "center" },
  tableColLeft: { flex: 1, paddingLeft: 10 },
  tableColRight: { width: 80, alignItems: "flex-end" },

  dressThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  basePriceText: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  priceText: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  priceInput: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 70,
    textAlign: "center",
    color: "#000",
  },

  formContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  catBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catBtnActive: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  catText: { fontSize: 12, color: "#64748b" },
  catTextActive: { color: "#fff", fontWeight: "bold" },

  imagePicker: { alignItems: "center", marginBottom: 10 },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "100%", height: 150, borderRadius: 12 },
  placeholderText: { color: "#94a3b8", marginTop: 5, fontSize: 12 },

  submitBtn: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
