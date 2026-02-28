// components/TailorSection.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TailorSectionProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: any;
}

const TailorSection: React.FC<TailorSectionProps> = ({
  children,
  title,
  subtitle,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.15)",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 22,
  },
});

export default TailorSection;
