import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="LoginByPhone" options={{ headerShown: false }} />
      <Stack.Screen name="tailor/signup" options={{ headerShown: false }} />
      <Stack.Screen name="tailor/login" options={{ headerShown: false }} />
      <Stack.Screen name="customer/signup" options={{ headerShown: false }} />
      <Stack.Screen name="customer/login" options={{ headerShown: false }} />
      <Stack.Screen name="Verification" options={{ headerShown: false }} />
    </Stack>
  );
}
