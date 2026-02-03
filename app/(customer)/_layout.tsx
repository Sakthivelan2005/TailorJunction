import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" />
      <Stack.Screen name="dress" />
      <Stack.Screen name="measurements" />
      <Stack.Screen name="order-summary" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="review" />
      <Stack.Screen name="tailors" />
      <Stack.Screen name="tracking" />
    </Stack>
  );
}
