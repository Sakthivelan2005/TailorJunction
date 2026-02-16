import Icons from "@/config/Icons";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderProps {
  title?: string;
  onBackPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBackPress }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ backgroundColor: colors.primary }}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});

export default Header;
