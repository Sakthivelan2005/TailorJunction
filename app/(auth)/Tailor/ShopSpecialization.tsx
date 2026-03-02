// app/(tailor)/signup/ShopSpecialization.tsx

import { useThemedIcons } from "@/config/Icons";
import { useShopDetails } from "@/context/AuthContext";
import { DressVarieties } from "@/data/DressVarieties";
import { specializations } from "@/data/Specialization";
import { useToast } from "@/hooks/useToast";
import { type Specialization } from "@/types/shopDetails";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TailorSection from "./TailorSection";

export const ShopSpecialization: React.FC<{ onNext: () => void }> = ({
  onNext,
}) => {
  const {
    selectedSpecs,
    setSelectedSpecs,

    dressVarieties,
    setDressVarieties,

    shopName,
    setShopName,

    shopLocation,
    setShopLocation,

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
  } = useShopDetails();

  const Icons = useThemedIcons();
  const { showToast } = useToast();

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

  /* ---------------- PINCODE FORMAT ---------------- */
  const formatPincode = (text: string) => text.replace(/\D/g, "").slice(0, 6);

  /* ---------------- DRESS VARIETIES LOGIC ---------------- */
  const availableVarieties = useMemo(() => {
    if (!selectedSpecs) return [];

    if (selectedSpecs === "Both") {
      return [...DressVarieties.Gents, ...DressVarieties.Ladies];
    }

    return DressVarieties[selectedSpecs] || [];
  }, [selectedSpecs]);

  /* Reset varieties when specialization changes */
  useEffect(() => {
    setDressVarieties([]);
  }, [selectedSpecs]);

  const toggleDressVariety = (item: string) => {
    setDressVarieties((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item],
    );
  };

  /* ---------------- VALIDATION ---------------- */
  const handleSignup = () => {
    if (!selectedSpecs) {
      showToast("Select a specialization", "warning");
      return;
    }

    if (!houseNo || !street || !area) {
      showToast("Please fill shop address", "warning");
      return;
    }

    if (pincode && pincode.length < 6) {
      showToast("Pincode must be 6 digits", "warning");
      return;
    }

    if (dressVarieties.length === 0) {
      showToast("Select at least one dress variety", "warning");
      return;
    }

    onNext();
  };

  /* ---------------- UI ---------------- */
  return (
    <FlatList
      data={specializations}
      numColumns={2}
      keyExtractor={(item: Specialization) => item}
      showsVerticalScrollIndicator={false}
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

              <View style={styles.locationInput}>
                {Icons.location}
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Enter complete shop address"
                  placeholderTextColor={styles.placeholderText.color}
                  value={shopLocation}
                  onChangeText={setShopLocation}
                  multiline
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
          {/* DRESS VARIETIES */}
          {availableVarieties.length > 0 && (
            <TailorSection title="Dress Varieties Offered">
              <View style={styles.varietyWrap}>
                {availableVarieties.map((item: string) => {
                  const checked = dressVarieties.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.varietyChip,
                        checked && styles.varietyChipActive,
                      ]}
                      onPress={() => toggleDressVariety(item)}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={18}
                        color={checked ? "#fff" : "#6B7280"}
                      />
                      <Text
                        style={[
                          styles.varietyText,
                          checked && styles.varietyTextActive,
                        ]}
                      >
                        {item}
                      </Text>
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

  placeholderText: { color: "#6B7280", fontWeight: "500" },
  photoPlaceholder: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

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

  varietyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  varietyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  varietyChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  varietyText: { fontWeight: "600", color: "#374151" },
  varietyTextActive: { color: "#fff" },

  signupButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 20,
  },
  signupButtonText: { color: "#fff", fontSize: 20, fontWeight: "800" },
});
