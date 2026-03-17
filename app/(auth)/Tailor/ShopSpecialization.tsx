// app/(tailor)/signup/ShopSpecialization.tsx

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { useThemedIcons } from "@/config/Icons";
import { DressImages } from "@/config/Images";
import { useAuth, useShopDetails } from "@/context/AuthContext";
import { specializations } from "@/data/Specialization";
import { useToast } from "@/hooks/useToast";
import { type Specialization } from "@/types/shopDetails";
import { SafeAreaView } from "react-native-safe-area-context";
import TailorSection from "./TailorSection";

/* ---------------- TYPES ---------------- */
type DressType = {
  dress_id: number;
  category: "men" | "women" | "kids";
  dress_name: string;
  dress_image: string;
  base_price: number;
};

/* ---------------- PRELOAD IMAGES ---------------- */
Object.values(DressImages).forEach((img) => {
  Asset.fromModule(img).downloadAsync();
});

const ShopSpecialization: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { userId, API_URL } = useAuth();
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
    mapLink,
    setMapLink,
  } = useShopDetails() as any;

  const Icons = useThemedIcons();
  const { showToast } = useToast();

  const [allDressTypes, setAllDressTypes] = useState<DressType[]>([]);

  // VALIDATION STATE
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // MAP STATES
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({ lat: 13.0827, lng: 80.2707 });
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/dress-types`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) setAllDressTypes(json.data);
      })
      .catch(console.error);
  }, []);

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

  useEffect(() => {
    setDressVarieties([]);
  }, [selectedSpecs]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const toggleDressVariety = (id: number) => {
    setDressVarieties((prev: number[]) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      if (updated.length > 0) clearError("dressVarieties");
      return updated;
    });
  };

  const pickImage = async (type: "profile" | "shop") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      if (type === "profile") {
        setProfilePhoto(result.assets[0].uri);
        clearError("profilePhoto");
      } else {
        setShopPhoto(result.assets[0].uri);
        clearError("shopPhoto");
      }
    }
  };

  const openMap = async () => {
    setIsMapVisible(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        setMapRegion({ lat, lng });
        if (!selectedCoords) setSelectedCoords({ lat, lng });
      }
    } catch (error) {
      console.log("Could not fetch initial location for map.");
    }
  };

  const confirmLocation = async () => {
    if (!selectedCoords) return;

    setIsGeocoding(true);
    try {
      const googleMapsLink = `https://maps.google.com/?q=${selectedCoords.lat},${selectedCoords.lng}`;
      setMapLink(googleMapsLink);
      clearError("mapLink");

      const geocode = await Location.reverseGeocodeAsync({
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        if (address.street) {
          setStreet(address.street);
          clearError("street");
        }
        if (address.subregion || address.city) {
          setArea(address.subregion || address.city);
          clearError("area");
        }
        if (address.city || address.region) {
          setDistrict(address.city || address.region);
          clearError("district");
        }
        if (address.postalCode) {
          setPincode(address.postalCode);
          clearError("pincode");
        }

        showToast("Exact location locked in!", "success");
      }
    } catch (error) {
      showToast("Could not fetch address details.", "error");
    } finally {
      setIsGeocoding(false);
      setIsMapVisible(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return "https://via.placeholder.com/150";
    return `${API_URL}/${path.replace(/^src\//, "").replace(/^\//, "")}`;
  };

  const formatPincode = (text: string) => {
    const formatted = text.replace(/\D/g, "").slice(0, 6);
    setPincode(formatted);
    if (formatted.length === 6) clearError("pincode");
  };

  // STRICT VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!shopName?.trim()) newErrors.shopName = "Shop name is required";
    if (!mapLink?.trim()) newErrors.mapLink = "Please pin location on map";
    if (!houseNo?.trim()) newErrors.houseNo = "House No required";
    if (!street?.trim()) newErrors.street = "Street required";
    if (!area?.trim()) newErrors.area = "Area required";
    if (!district?.trim()) newErrors.district = "District required";
    if (!pincode?.trim() || pincode.length < 6)
      newErrors.pincode = "Valid 6-digit pincode required";

    if (!profilePhoto) newErrors.profilePhoto = "Profile photo is missing";
    if (!shopPhoto) newErrors.shopPhoto = "Shop photo is missing";

    if (!selectedSpecs)
      newErrors.selectedSpecs = "Please select a specialization";
    if (dressVarieties.length === 0)
      newErrors.dressVarieties = "Select at least one dress type";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast("Please complete all required fields correctly.", "error");
      return false;
    }
    return true;
  };

  const handleSignup = () => {
    if (!validateForm()) return; // Stop if validation fails

    saveTailorPricing(userId, dressVarieties, availableVarieties)
      .then(() => {
        onNext();
      })
      .catch((err: any) => {
        showToast(err.message || "Failed to save pricing", "error");
      });
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style> body { padding: 0; margin: 0; } #map { height: 100vh; width: 100vw; } </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map').setView([${mapRegion.lat}, ${mapRegion.lng}], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            var marker = L.marker([${selectedCoords?.lat || mapRegion.lat}, ${selectedCoords?.lng || mapRegion.lng}], {draggable: true}).addTo(map);

            marker.on('dragend', function(e) {
                var position = marker.getLatLng();
                window.ReactNativeWebView.postMessage(JSON.stringify({lat: position.lat, lng: position.lng}));
            });

            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                window.ReactNativeWebView.postMessage(JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng}));
            });
        </script>
    </body>
    </html>
  `;

  return (
    <View>
      <FlatList
        data={specializations}
        numColumns={2}
        keyExtractor={(item: Specialization) => item}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => {
          const isSelected = selectedSpecs === item;
          return (
            <TouchableOpacity
              style={[
                styles.specChip,
                isSelected && styles.specChipActive,
                errors.selectedSpecs && { borderColor: "#ef4444" },
              ]}
              onPress={() => {
                setSelectedSpecs(item);
                clearError("selectedSpecs");
              }}
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
            <TailorSection title="Shop Location" style={{ marginTop: 20 }}>
              <View style={styles.locationGroup}>
                {/* Shop Name */}
                <View>
                  <View
                    style={[
                      styles.locationInput,
                      errors.shopName && styles.inputError,
                    ]}
                  >
                    {Icons.shop}
                    <TextInput
                      style={styles.locationTextInput}
                      placeholder="Enter Your Shop Name"
                      placeholderTextColor={styles.placeholderText.color}
                      value={shopName}
                      onChangeText={(t) => {
                        setShopName(t);
                        clearError("shopName");
                      }}
                    />
                  </View>
                  {errors.shopName && (
                    <Text style={styles.errorText}>{errors.shopName}</Text>
                  )}
                </View>

                {/* Map Link */}
                <View>
                  <View style={styles.mapLinkRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          color: "#3b82f6",
                          backgroundColor: "#eff6ff",
                        },
                        errors.mapLink && styles.inputError,
                      ]}
                      placeholder="Pin Exact Location on Map ➡️"
                      placeholderTextColor={styles.placeholderText.color}
                      value={mapLink}
                      editable={false}
                    />
                    <TouchableOpacity
                      style={[
                        styles.mapIconBtn,
                        errors.mapLink && { borderColor: "#ef4444" },
                      ]}
                      onPress={openMap}
                    >
                      <MaterialCommunityIcons
                        name="google-maps"
                        size={28}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.mapLink && (
                    <Text style={styles.errorText}>{errors.mapLink}</Text>
                  )}
                </View>

                {/* House & Street */}
                <View style={styles.addressRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.houseNo && styles.inputError,
                      ]}
                      placeholder="House No"
                      placeholderTextColor={styles.placeholderText.color}
                      value={houseNo}
                      onChangeText={(t) => {
                        setHouseNo(t);
                        clearError("houseNo");
                      }}
                    />
                    {errors.houseNo && (
                      <Text style={styles.errorText}>{errors.houseNo}</Text>
                    )}
                  </View>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      style={[styles.input, errors.street && styles.inputError]}
                      placeholder="Street"
                      placeholderTextColor={styles.placeholderText.color}
                      value={street}
                      onChangeText={(t) => {
                        setStreet(t);
                        clearError("street");
                      }}
                    />
                    {errors.street && (
                      <Text style={styles.errorText}>{errors.street}</Text>
                    )}
                  </View>
                </View>

                {/* Area & District */}
                <View style={styles.addressRow}>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      style={[styles.input, errors.area && styles.inputError]}
                      placeholder="Area"
                      placeholderTextColor={styles.placeholderText.color}
                      value={area}
                      onChangeText={(t) => {
                        setArea(t);
                        clearError("area");
                      }}
                    />
                    {errors.area && (
                      <Text style={styles.errorText}>{errors.area}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.district && styles.inputError,
                      ]}
                      placeholder="District"
                      placeholderTextColor={styles.placeholderText.color}
                      value={district}
                      onChangeText={(t) => {
                        setDistrict(t);
                        clearError("district");
                      }}
                    />
                    {errors.district && (
                      <Text style={styles.errorText}>{errors.district}</Text>
                    )}
                  </View>
                </View>

                {/* Pincode */}
                <View>
                  <TextInput
                    style={[styles.input, errors.pincode && styles.inputError]}
                    placeholder="Pincode"
                    placeholderTextColor={styles.placeholderText.color}
                    value={pincode}
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={formatPincode}
                  />
                  {errors.pincode && (
                    <Text style={styles.errorText}>{errors.pincode}</Text>
                  )}
                </View>
              </View>
            </TailorSection>

            <TailorSection title="Upload Photos">
              <View style={styles.photoRow}>
                <View style={styles.photoContainer}>
                  <TouchableOpacity onPress={() => pickImage("profile")}>
                    {profilePhoto ? (
                      <Image
                        source={{ uri: profilePhoto }}
                        style={styles.uploadedPhoto}
                      />
                    ) : (
                      <View
                        style={[
                          styles.photoPlaceholder,
                          errors.profilePhoto && styles.inputError,
                        ]}
                      >
                        <Ionicons
                          name="person-outline"
                          size={40}
                          color={errors.profilePhoto ? "#ef4444" : "#D1D5DB"}
                        />
                        <Text
                          style={[
                            styles.placeholderText,
                            errors.profilePhoto && { color: "#ef4444" },
                          ]}
                        >
                          Profile Photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.profilePhoto && (
                    <Text style={styles.errorText}>{errors.profilePhoto}</Text>
                  )}
                </View>

                <View style={styles.photoContainer}>
                  <TouchableOpacity onPress={() => pickImage("shop")}>
                    {shopPhoto ? (
                      <Image
                        source={{ uri: shopPhoto }}
                        style={styles.uploadedPhoto}
                      />
                    ) : (
                      <View
                        style={[
                          styles.photoPlaceholder,
                          errors.shopPhoto && styles.inputError,
                        ]}
                      >
                        <Ionicons
                          name="storefront-outline"
                          size={40}
                          color={errors.shopPhoto ? "#ef4444" : "#D1D5DB"}
                        />
                        <Text
                          style={[
                            styles.placeholderText,
                            errors.shopPhoto && { color: "#ef4444" },
                          ]}
                        >
                          Shop Photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {errors.shopPhoto && (
                    <Text style={styles.errorText}>{errors.shopPhoto}</Text>
                  )}
                </View>
              </View>
            </TailorSection>

            <TailorSection title="Shop Specialization" />
            {errors.selectedSpecs && (
              <Text style={[styles.errorText, { marginBottom: 10 }]}>
                {errors.selectedSpecs}
              </Text>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {availableVarieties.length > 0 && (
              <TailorSection title="Dress Types Offered">
                <View
                  style={[
                    styles.varietyWrap,
                    errors.dressVarieties && {
                      padding: 10,
                      borderWidth: 1,
                      borderColor: "#ef4444",
                      borderRadius: 16,
                    },
                  ]}
                >
                  {availableVarieties.map((dress) => {
                    const checked = dressVarieties.includes(dress.dress_id);
                    const imageSource = getImageUrl(dress.dress_image) as any;

                    return (
                      <TouchableOpacity
                        key={dress.dress_id}
                        style={[
                          styles.varietyChip,
                          checked && styles.varietyChipActive,
                        ]}
                        onPress={() => toggleDressVariety(dress.dress_id)}
                      >
                        <Image
                          source={{ uri: imageSource }}
                          style={styles.dressImage}
                        />
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
                {errors.dressVarieties && (
                  <Text style={[styles.errorText, { marginTop: 5 }]}>
                    {errors.dressVarieties}
                  </Text>
                )}
              </TailorSection>
            )}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
            >
              <Text style={styles.signupButtonText}>Complete Sign Up</Text>
            </TouchableOpacity>
          </>
        }
      />

      {/* FREE OPENSTREETMAP MODAL */}
      <Modal visible={isMapVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsMapVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pin Exact Shop Location</Text>
            <View style={{ width: 28 }} />
          </View>

          <WebView
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={(event) => {
              const data = JSON.parse(event.nativeEvent.data);
              setSelectedCoords({ lat: data.lat, lng: data.lng });
            }}
          />

          <View style={styles.mapFooter}>
            <Text style={styles.mapHint}>
              Drag the blue pin or tap the map to set your exact location.
            </Text>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !selectedCoords && { backgroundColor: "#cbd5e1" },
              ]}
              disabled={!selectedCoords || isGeocoding}
              onPress={confirmLocation}
            >
              {isGeocoding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  Lock Location & Fill Address
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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

  mapLinkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mapIconBtn: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fecaca",
    justifyContent: "center",
    alignItems: "center",
  },

  addressRow: { flexDirection: "row", gap: 12 },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },

  // ERROR STYLES
  inputError: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
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
  specChipActive: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
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
  varietyChipActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
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

  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    elevation: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  map: { flex: 1 },
  mapFooter: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  mapHint: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 15,
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default ShopSpecialization;
