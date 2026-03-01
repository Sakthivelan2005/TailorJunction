import { useThemedIcons } from "@/config/Icons";
import { useShopDetails } from "@/context/AuthContext";
import { specializations } from "@/data/Specialization";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
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

    profilePhoto,
    setProfilePhoto,

    shopPhoto,
    setShopPhoto,

    pincode,
    setPincode,
  } = useShopDetails();

  const Icons = useThemedIcons();
  const { showToast } = useToast();

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

  const handleSignup = () => {
    if (pincode && !/^\d+$/.test(pincode)) {
      showToast("Pincode must contain only numbers", "warning");
    }
    if (pincode && pincode.length < 6) {
      showToast("Pincode must be 6 digits", "warning");
    }

    if (!selectedSpecs) {
      showToast("Select a specialization", "warning");
      return;
    }
    if (!houseNo || !street || !area) {
      showToast("Please fill shop address", "warning");
      return;
    }
    onNext();
  };

  const formatPincode = (text: string) => {
    // Remove non-digit characters
    const cleaned = text.replace(/\D/g, "");
    // Limit to 6 digits
    return cleaned.slice(0, 6);
  };

  return (
    <FlatList
      data={specializations}
      numColumns={2}
      keyExtractor={(item) => item}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const isSelected = selectedSpecs === item;

        return (
          <TouchableOpacity
            style={[styles.specChip, isSelected && styles.specChipActive]}
            onPress={() => setSelectedSpecs(item)}
          >
            {/* Radio circle */}
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
                  value={shopName}
                  onChangeText={setShopName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.locationInput}>
                {Icons.location}
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Enter complete shop address"
                  value={shopLocation}
                  onChangeText={setShopLocation}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="House No"
                  value={houseNo}
                  onChangeText={setHouseNo}
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Street"
                  value={street}
                  onChangeText={setStreet}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Area"
                  value={area}
                  onChangeText={setArea}
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="District"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Pincode"
                value={pincode}
                onChangeText={(text) => {
                  const formatted = formatPincode(text);
                  setPincode(formatted);
                }}
                keyboardType="number-pad"
                placeholderTextColor="#9CA3AF"
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
          <Text style={styles.specCount}>
            Selected: {selectedSpecs ?? "None"}
          </Text>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Complete Sign Up</Text>
          </TouchableOpacity>
        </>
      }
    />
  );
};

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
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#374151",
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
    gap: 8,
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

  specCount: {
    textAlign: "center",
    marginVertical: 12,
    color: "#6B7280",
  },

  signupButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
});
