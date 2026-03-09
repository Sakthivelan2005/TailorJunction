// app/index.js
import { LinearGradient } from "expo-linear-gradient";
import { Href, Link } from "expo-router"; //
import React from "react";
import {
  ColorValue,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

// Define the required type for the colors array that satisfies the LinearGradient props
type GradientColorsArray = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface NavigationButtonProps {
  title: string;
  href: Href;
  colorScheme: "tailor" | "customer"; // Use specific literal types for colorScheme0
}

// Apply the interface to the component props using React.FC or inline typing

export default function WelcomeScreen() {
  //Using setUserRole to set separate theme for customers and Tailors

  const NavigationButton: React.FC<NavigationButtonProps> = ({
    title,
    href,
    colorScheme,
  }) => {
    // Explicitly define the colors using the new type
    const tailorColors: GradientColorsArray = ["#EE82EE", "#DDA0DD"];
    const customerColors: GradientColorsArray = ["#40E0D0", "#00CED1"];

    const gradientColors =
      colorScheme === "tailor" ? tailorColors : customerColors;

    const { setUserRole } = useTheme();
    const { setRole } = useAuth();

    return (
      <Link
        href={href}
        onPress={() => {
          setUserRole(colorScheme);
          setRole(colorScheme);
        }}
        asChild
      >
        <TouchableOpacity style={styles.buttonContainer}>
          <LinearGradient
            colors={gradientColors}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <Text style={styles.buttonText}>{title}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Background Curve */}
      <View style={styles.topCurveContainer}>
        <LinearGradient
          colors={["#40E0D0", "#00CED1"]}
          style={styles.curveBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <NavigationButton
          title="Tailors"
          href={"/(auth)/tailor/signup"}
          colorScheme="tailor"
        />
        <NavigationButton
          title="Customer"
          href={"/(auth)/customer/signup"}
          colorScheme="customer"
        />
      </View>

      {/* Bottom Background Curve */}
      <View style={styles.bottomCurveContainer}>
        <LinearGradient
          colors={["#EE82EE", "#DDA0DD"]}
          style={styles.curveBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // --- Curves Styling ---
  topCurveContainer: {
    width: "100%",
    height: 150, // Height of the curve area
    overflow: "hidden",
  },
  bottomCurveContainer: {
    width: "100%",
    height: 150, // Height of the curve area
    overflow: "hidden",
    transform: [{ rotate: "180deg" }], // Flip the curve for the bottom
  },
  curveBackground: {
    flex: 1,
    borderBottomRightRadius: 500, // Large radius creates the smooth curve
    borderBottomLeftRadius: 500,
    transform: [{ scaleX: 1.5 }], // Stretch horizontally to cover width
  },
  // --- Buttons Styling ---
  buttonSection: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    // Ensure buttons stay centered in the main view area
    flexGrow: 1,
  },
  buttonContainer: {
    width: 250,
    borderRadius: 50, // Makes the button rounded like a pill
    overflow: "hidden",
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
