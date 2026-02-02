// components/CustomToast.tsx - ABSOLUTE + Z-INDEX
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

interface ToastProps {
  message: string;
  type: "success" | "warning" | "error";
  onClose?: () => void;
  index: number;
}

export const CustomToast = ({ message, type, onClose, index }: ToastProps) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Slide up + fade in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: "#10B981", icon: "✅" };
      case "warning":
        return { bg: "#F59E0B", icon: "⚠️" };
      case "error":
        return { bg: "#EF4444", icon: "❌" };
      default:
        return { bg: "#6B7280", icon: "ℹ️" };
    }
  };

  const colors = getColors();
  const { height: screenHeight } = Dimensions.get("window");

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          bottom: 100 + index * 80, // Stack toasts vertically
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ThemedView style={[styles.toast, { backgroundColor: colors.bg }]}>
        <ThemedText style={styles.icon}>{colors.icon}</ThemedText>
        <ThemedText style={styles.message} numberOfLines={2}>
          {message}
        </ThemedText>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <ThemedText style={styles.closeText}>✕</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999, // ✅ FRONT Z-INDEX
    elevation: 999, // ✅ ANDROID Z-INDEX
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 16,
    elevation: 24,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    fontWeight: "bold",
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
