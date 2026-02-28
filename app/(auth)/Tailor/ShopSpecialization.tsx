// app/(tailor)/signup/ShopSpecialization.tsx
import { useThemedIcons } from "@/config/Icons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import TailorSection from "./TailorSection";

const specializations = [
  "Shirt",
  "Pant",
  "Kurta",
  "Sherwani",
  "Suit",
  "Blazer",
  "Trousers",
  "Jeans",
  "Shorts",
  "Dhoti",
  "Lungi",
  "Pathani",
];

export const ShopSpecialization: React.FC<{ onNext: () => void }> = ({
  onNext,
}) => {
  const { password, setPassword } = useAuth();
  const Icons = useThemedIcons();
  const { showToast } = useToast();
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [shopLocation, setShopLocation] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [district, setDistrict] = useState("Chennai");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [shopPhoto, setShopPhoto] = useState<string | null>(null);

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

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec)
        ? prev.filter((s) => s !== spec)
        : [...prev, spec].slice(0, 8),
    );
  };

  const handleSignup = () => {
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "warning");
      return;
    }
    if (!selectedSpecs.length) {
      showToast("Select at least one specialization", "warning");
      return;
    }
    if (!houseNo || !street || !area) {
      showToast("Please fill shop address", "warning");
      return;
    }
    onNext();
  };

  return (
    <FlatList
      data={specializations}
      numColumns={2}
      keyExtractor={(item) => item}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.specChip,
            selectedSpecs.includes(item) && styles.specChipActive,
          ]}
          onPress={() => toggleSpecialization(item)}
        >
          <Text
            style={[
              styles.specText,
              selectedSpecs.includes(item) && styles.specTextActive,
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
      ListHeaderComponent={
        <>
          {/* SHOP LOCATION */}
          <TailorSection title="Shop Location" style={{ marginTop: 20 }}>
            <View style={styles.locationGroup}>
              <View style={styles.locationInput}>
                {Icons.location}
                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Enter complete shop address"
                  value={shopLocation}
                  onChangeText={setShopLocation}
                  multiline
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="House No"
                  value={houseNo}
                  onChangeText={setHouseNo}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Street"
                  value={street}
                  onChangeText={setStreet}
                />
              </View>

              <View style={styles.addressRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Area"
                  value={area}
                  onChangeText={setArea}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="District"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
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

          {/* SPECIALIZATION TITLE */}
          <TailorSection title="Shop Specializations" />
        </>
      }
      ListFooterComponent={
        <>
          <Text style={styles.specCount}>
            {selectedSpecs.length}/8 selected
          </Text>

          {/* PASSWORD */}
          <TailorSection title="Password">
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </TailorSection>

          {/* SUBMIT */}
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Complete Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleButton}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleButtonText}>Sign with Google</Text>
          </TouchableOpacity>
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
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
  locationTextInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
  },
  addressRow: { flexDirection: "row", gap: 12 },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
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
  },
  specChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
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
    marginBottom: 16,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    marginBottom: 40,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
