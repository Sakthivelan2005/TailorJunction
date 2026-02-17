import Icons from "@/config/Icons";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  title?: string;
  onBackPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBackPress }) => {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.primary }}>
      <View style={styles.container}>
        {/* Left Side: Back Button */}
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          {Icons.back}
        </TouchableOpacity>

        {/* Center: Title (Only renders if string is provided and not empty) */}
        <View style={styles.titleContainer}>
          {title ? (
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 25,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    top: 0,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#333",
  },
});

export default Header;
