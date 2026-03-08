// components/NetworkMonitor.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNetInfo } from "@react-native-community/netinfo";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

export default function NetworkMonitor() {
  const netInfo = useNetInfo();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [isSlow, setIsSlow] = useState(false);

  // Consider it "connected" if it is connected AND internet is actually reachable.
  // We use !== false because when the app first loads, these values are 'null' for a split second.
  const isConnected =
    netInfo.isConnected !== false && netInfo.isInternetReachable !== false;

  useEffect(() => {
    // 🚀 Detect Slow Networks (2G or 3G)
    if (isConnected && netInfo.type === "cellular" && netInfo.details) {
      // Cast details to any to access cellularGeneration safely
      const gen = (netInfo.details as any).cellularGeneration;
      if (gen === "2g" || gen === "3g") {
        setIsSlow(true);
      } else {
        setIsSlow(false);
      }
    } else {
      setIsSlow(false);
    }
  }, [netInfo, isConnected]);

  useEffect(() => {
    if (!isConnected || isSlow) {
      // Slide down if offline or slow
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true, // 🚀 Keeps it fast on 2GB RAM phones
      }).start();
    } else if (isConnected && !isSlow) {
      // Wait 2 seconds so they see "Back Online", then slide it back up
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);

      return () => clearTimeout(timer); // Cleanup timer if component unmounts
    }
  }, [isConnected, isSlow]);

  // Determine colors and messages dynamically
  let bgColor = "#ef4444"; // Red
  let message = "No Internet Connection";
  let iconName: keyof typeof MaterialCommunityIcons.glyphMap = "wifi-off";

  if (isConnected && isSlow) {
    bgColor = "#f59e0b"; // Orange
    message = "Slow Internet Connection";
    iconName = "wifi-strength-1";
  } else if (isConnected && !isSlow) {
    bgColor = "#10b981"; // Green
    message = "Back Online";
    iconName = "wifi";
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons name={iconName} size={18} color="#fff" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it stays on top of everything!
    paddingTop: Platform.OS === "ios" ? 50 : 40, // Account for notch/status bar
    paddingBottom: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
});
