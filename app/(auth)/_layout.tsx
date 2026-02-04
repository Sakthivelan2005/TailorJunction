import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="signup"
        options={{ title: "signup", headerTitleAlign: "center" }}
      />
      <Stack.Screen
        name="login"
        options={{ title: "login", headerTitleAlign: "center" }}
      />
      <Stack.Screen
        name="Verification"
        options={{ title: "Verification", headerTitleAlign: "center" }}
      />
    </Stack>
  );
}
