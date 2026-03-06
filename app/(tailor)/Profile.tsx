//app/(tailor)/Profile.tsx
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
    cloth_type: string;
    price: string;
  }[];
}

export default function ProfileScreen() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const { userId, API_URL } = useAuth();

  const ImagePath = "@/Backend/src"; // Base path for images from backend

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/api/tailor/${userId}/profile`);
      const result = await response.json();
      if (response.ok) setData(result);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!data) return <Text style={styles.errorText}>Profile not found</Text>;

  const { details, pricing } = data;
  const address = `${details.house_no}, ${details.street}, ${details.area}, ${details.district} - ${details.pincode}`;

  console.log("Profile Image URL:", `${API_URL}${details.profile_photo}`);
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <Image
            source={{
              uri: `${API_URL}${details.profile_photo}`,
            }}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.infoText}>
          Your Name: <Text style={styles.bold}>{details.tailor_name}</Text>
        </Text>
        <Text style={styles.infoText}>
          Shop Name: <Text style={styles.bold}>{details.shop_name}</Text>
        </Text>
        <Text style={styles.infoText}>
          Phone: <Text style={styles.bold}>{details.phone}</Text>
        </Text>
        <Text style={styles.infoText}>
          Email: <Text style={styles.bold}>{details.email}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About Shop</Text>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColLeft}>Cloth Type</Text>
          <Text style={styles.tableColRight}>Price ₹</Text>
        </View>
        {pricing.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableColLeft}>{item.cloth_type}</Text>
            <Text style={styles.tableColRight}>{item.price}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
    paddingTop: 60,
  },
  loader: { flex: 1, justifyContent: "center" },
  errorText: { textAlign: "center", marginTop: 50 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  infoText: { fontSize: 14, marginBottom: 8, color: "#555" },
  bold: { fontWeight: "bold", color: "#000" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  addressText: { fontSize: 14, color: "gray", lineHeight: 20 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableRow: { flexDirection: "row", paddingVertical: 8 },
  tableColLeft: { flex: 1, fontSize: 14 },
  tableColRight: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    fontWeight: "bold",
  },
});
