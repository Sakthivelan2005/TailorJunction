// app/(tailor)/signup/ShopSpecialization.tsx
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === "profile") setProfilePhoto(uri);
      else setShopPhoto(uri);
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecs(
      (prev) =>
        prev.includes(spec)
          ? prev.filter((s) => s !== spec)
          : [...prev, spec].slice(0, 8), // Max 8 specializations
    );
  };

  const handleSignup = async () => {
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters");
      return;
    }
    if (selectedSpecs.length === 0) {
      Alert.alert("Please select at least one specialization");
      return;
    }
    if (!houseNo || !street || !area) {
      Alert.alert("Please fill location details");
      return;
    }
    onNext();
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      <TailorSection title="Shop Location" style={{ marginTop: 20 }}>
        <View style={styles.locationGroup}>
          <View style={styles.locationInput}>
            <Ionicons name="location-outline" size={24} color="#8B5CF6" />
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
              <Image source={{ uri: shopPhoto }} style={styles.uploadedPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="storefront-outline" size={40} color="#D1D5DB" />
                <Text style={styles.placeholderText}>Shop Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </TailorSection>

      <TailorSection title="Shop Specializations">
        <FlatList
          data={specializations}
          numColumns={2}
          keyExtractor={(item) => item}
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
          contentContainerStyle={styles.specList}
        />
        <Text style={styles.specCount}>{selectedSpecs.length}/8 selected</Text>
      </TailorSection>

      <TailorSection title="Password">
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </TailorSection>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Complete Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton}>
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.googleButtonText}>Sign with Google</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  locationGroup: { gap: 16 },
  locationInput: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
    minHeight: 80,
  },
  locationTextInput: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
    paddingTop: 4,
  },
  addressRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    flex: 1,
  },
  photoRow: { flexDirection: "row", gap: 16 },
  photoContainer: { flex: 1 },
  uploadedPhoto: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#10B981",
  },
  photoPlaceholder: {
    height: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  specList: {
    gap: 12,
    paddingBottom: 20,
  },
  specChip: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    maxWidth: 150,
  },
  specChipActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  specText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  specTextActive: {
    color: "#FFFFFF",
  },
  specCount: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  signupButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 40,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
});
