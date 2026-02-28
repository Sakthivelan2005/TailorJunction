// app/tailors.js (or .tsx)
import { Colors } from "@/constants/theme";
import { Link } from "expo-router";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

export default function TailorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || "light"];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: { fontSize: 20, marginBottom: 10, color: colors.text },
  });
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tailors Section</Text>
      <Link href="/">Go Home</Link>
    </View>
  );
}
