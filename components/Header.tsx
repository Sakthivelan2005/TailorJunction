import { useThemedIcons } from "@/config/Icons";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface HeaderProps {
  title?: string;
  onBackPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBackPress }) => {
  const { colors } = useTheme();
  const Icons = useThemedIcons();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.primary }]}>
      <View style={styles.container}>
        {/* Left Side: Back Button */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          {Icons.back}
        </TouchableOpacity>

        {/* Center: Title */}
        <View style={styles.titleWrapper}>
          {title ? (
            <Text
              style={[styles.titleText, { color: colors.text || "#333" }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right Side: Empty view to balance the flex (optional) */}
        <View style={styles.backButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // Handles the notch/status bar area professionally
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
  },
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center", // Vertically centers items
    justifyContent: "space-between", // Spaces back button and title
    paddingHorizontal: 8,
  },
  backButton: {
    width: 45, // Fixed width ensures title stays centered
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center", // Centers text horizontally
    justifyContent: "center", // Centers text vertically
  },
  titleText: {
    fontSize: 28, // 28 is usually too large for standard headers
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Header;
