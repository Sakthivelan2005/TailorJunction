// lib/api.ts - ✅ Outside app/ folder
const API_URL = "http://192.168.1.2:3001"; // Your PC IP

export const api = {
  signup: async (data: any) => {
    const response = await fetch(`${API_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Signup failed");
    return response.json();
  },

  verifyOtp: async (phone: string, otp: string) => {
    const response = await fetch(`${API_URL}/api/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    if (!response.ok) throw new Error("Invalid OTP");
    return response.json();
  },
};
