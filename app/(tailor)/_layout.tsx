import { Stack } from "expo-router";

export default function TailorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="order" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="pricing" />
    </Stack>
  );
}
