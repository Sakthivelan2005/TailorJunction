// app/(tailor)/signup/ShopSpecialization.tsx

import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useThemedIcons } from "@/config/Icons";
import { DressImages, Images } from "@/config/Images";
import { useAuth, useShopDetails } from "@/context/AuthContext";
import { specializations } from "@/data/Specialization";
import { useToast } from "@/hooks/useToast";
import { type Specialization } from "@/types/shopDetails";
import TailorSection from "./TailorSection";

/* ---------------- CONFIG ---------------- */
const API_URL = "http://192.168.1.7:3001";

/* ---------------- TYPES ---------------- */
type DressType = {
  dress_id: number;
  category: "men" | "women" | "kids";
  dress_name: string;
  dress_image: string; // DB path (key for DressImages)
  base_price: number;
};

/* ---------------- PRELOAD IMAGES (ZERO LATENCY) ---------------- */
Object.values(DressImages).forEach((img) => {
  Asset.fromModule(img).downloadAsync();
});

/* =============================================================== */
export const ShopSpecialization: React.FC<{ onNext: () => void }> = ({
  onNext,
}) => {
  const { userId } = useAuth();
  const {
    selectedSpecs,
    setSelectedSpecs,

    dressVarieties,
    setDressVarieties,

    shopName,
    setShopName,

    houseNo,
    setHouseNo,

    street,
    setStreet,

    area,
    setArea,

    district,
    setDistrict,

    pincode,
    setPincode,

    profilePhoto,
    setProfilePhoto,

    shopPhoto,
    setShopPhoto,

    saveTailorPricing,
  } = useShopDetails();

  const Icons = useThemedIcons();
  const { showToast } = useToast();

  /* ---------------- FETCH DRESS TYPES ---------------- */
  const [allDressTypes, setAllDressTypes] = useState<DressType[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/dress-types`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setAllDressTypes(json.data);
      })
      .catch(console.error);
  }, []);

  /* ---------------- FILTER BY SPECIALIZATION ---------------- */
  const availableVarieties = useMemo((): DressType[] => {
    if (!selectedSpecs) return [];

    switch (selectedSpecs) {
      case "Gents":
        return allDressTypes.filter((d) => d.category === "men");
      case "Ladies":
        return allDressTypes.filter((d) => d.category === "women");
      case "Kids":
        return allDressTypes.filter((d) => d.category === "kids");
      case "Both":
        return allDressTypes.filter(
          (d) => d.category === "men" || d.category === "women",
        );
      default:
        return [];
    }
  }, [selectedSpecs, allDressTypes]);

  /* Reset dress selection when specialization changes */
  useEffect(() => {
    setDressVarieties([]);
  }, [selectedSpecs]);

  /* ---------------- TOGGLE DRESS TYPE ---------------- */
  const toggleDressVariety = (id: number) => {
    setDressVarieties((prev: number[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = async (type: "profile" | "shop") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      type === "profile" ? setProfilePhoto(uri) : setShopPhoto(uri);
    }
  };

  const formatPincode = (text: string) => text.replace(/\D/g, "").slice(0, 6);

  /* ---------------- VALIDATION ---------------- */
  const handleSignup = () => {
    if (!selectedSpecs) return showToast("Select a specialization", "warning");

    if (!houseNo || !street || !area)
      return showToast("Please fill shop address", "warning");

    if (pincode && pincode.length < 6)
      return showToast("Pincode must be 6 digits", "warning");

    if (dressVarieties.length === 0)
      return showToast("Select at least one dress type", "warning");

    saveTailorPricing(userId, dressVarieties, availableVarieties).then(() => {
      console.log(
        "userId:",
        userId,
        "dressVarieties:",
        dressVarieties,
        "availableVarieties:",
        availableVarieties,
      );
      onNext();
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <FlatList
      data={specializations}
      numColumns={2}
      keyExtractor={(item: Specialization) => item}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const isSelected = selectedSpecs === item;
        return (
          <TouchableOpacity
            style={[styles.specChip, isSelected && styles.specChipActive]}
            onPress={() => setSelectedSpecs(item)}
          >
            <View style={styles.radioOuter}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text
              style={[styles.specText, isSelected && styles.specTextActive]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      }}
      ListHeaderComponent={
        <>
          {/* SHOP LOCATION */}
          <TailorSection title="Shop Location" style={{ marginTop: 20 }}>
            <View style={styles.locationGroup}>
              <View style={styles.locationInput}>
                {Icons.shop}
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Enter Your Shop Name"
                  placeholderTextColor={styles.placeholderText.color}
                  value={shopName}
                  onChangeText={setShopName}
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="House No"
                  placeholderTextColor={styles.placeholderText.color}
                  value={houseNo}
                  onChangeText={setHouseNo}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Street"
                  placeholderTextColor={styles.placeholderText.color}
                  value={street}
                  onChangeText={setStreet}
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Area"
                  placeholderTextColor={styles.placeholderText.color}
                  value={area}
                  onChangeText={setArea}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="District"
                  placeholderTextColor={styles.placeholderText.color}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor={styles.placeholderText.color}
                value={pincode}
                keyboardType="number-pad"
                onChangeText={(t) => setPincode(formatPincode(t))}
              />
            </View>
          </TailorSection>

          {/* UPLOAD PHOTOS */}
          <TailorSection title="Upload Photos">
            <View style={styles.photoRow}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => pickImage("profile")}
              >
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={styles.uploadedPhoto}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-outline" size={40} color="#D1D5DB" />
                    <Text style={styles.placeholderText}>Profile Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoContainer}
                onPress={() => pickImage("shop")}
              >
                {shopPhoto ? (
                  <Image
                    source={{ uri: shopPhoto }}
                    style={styles.uploadedPhoto}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons
                      name="storefront-outline"
                      size={40}
                      color="#D1D5DB"
                    />
                    <Text style={styles.placeholderText}>Shop Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TailorSection>

          <TailorSection title="Shop Specialization" />
        </>
      }
      ListFooterComponent={
        <>
          {/* DRESS TYPES */}
          {availableVarieties.length > 0 && (
            <TailorSection title="Dress Types Offered">
              <View style={styles.varietyWrap}>
                {availableVarieties.map((dress) => {
                  const checked = dressVarieties.includes(dress.dress_id);
                  const imageSource =
                    DressImages[dress.dress_image] ?? Images.placeholder;

                  return (
                    <TouchableOpacity
                      key={dress.dress_id}
                      style={[
                        styles.varietyChip,
                        checked && styles.varietyChipActive,
                      ]}
                      onPress={() => toggleDressVariety(dress.dress_id)}
                    >
                      <Image source={imageSource} style={styles.dressImage} />
                      <Text
                        style={[
                          styles.varietyText,
                          checked && styles.varietyTextActive,
                        ]}
                      >
                        {dress.dress_name}
                      </Text>
                      <Text style={styles.price}>₹{dress.base_price}</Text>
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={18}
                        color={checked ? "#fff" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TailorSection>
          )}

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Complete Sign Up</Text>
          </TouchableOpacity>
        </>
      }
    />
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40 },

  locationGroup: { gap: 16 },
  locationInput: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
  },
  locationTextInput: { flex: 1, fontSize: 16 },

  addressRow: { flexDirection: "row", gap: 12 },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },

  photoRow: { flexDirection: "row", gap: 16 },
  photoContainer: { flex: 1 },
  uploadedPhoto: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#10B981",
  },

  photoPlaceholder: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#6B7280", fontWeight: "500" },

  specChip: {
    flex: 1,
    margin: 6,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  specChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  specText: { fontWeight: "600", color: "#374151" },
  specTextActive: { color: "#fff" },

  varietyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  varietyChip: {
    width: "48%",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  varietyChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  dressImage: { width: 70, height: 70, marginBottom: 6 },
  varietyText: { fontWeight: "600", textAlign: "center", color: "#374151" },
  varietyTextActive: { color: "#fff" },
  price: { fontSize: 13, color: "#6B7280", marginBottom: 4 },

  signupButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  signupButtonText: { color: "#fff", fontSize: 20, fontWeight: "800" },
});
