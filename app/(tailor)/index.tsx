// app/tailors.js (or .tsx)
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TailorsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tailors Section</Text>
      <Link href="/">Go Home</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, marginBottom: 10 },
});
