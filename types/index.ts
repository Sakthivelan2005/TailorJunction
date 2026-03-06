import { Socket } from "socket.io-client";

export interface AuthContextType {
  API_URL: string;
  socket: Socket | null;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  otp: string;
  verifiedOtp: boolean;
  setOtp: (otp: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  dob: Date | null;
  setDob: (dob: Date | null) => void;
  currentStep: "login" | "verification" | "signup" | "home";
  setCurrentStep: (step: AuthContextType["currentStep"]) => void;
  checkPhoneExists: (phone: string) => Promise<boolean>;

  // MySQL integration
  userId?: string;
  setUserId: (id: string) => void;
  role?: "customer" | "tailor";
  setRole: (role: "customer" | "tailor") => void;
  isLoading: boolean;
  error: string;

  // Functions
  sendVerificationCode: (phone: string) => Promise<void>;
  completeSignup: () => Promise<void>;
  completeTailorDetails: () => Promise<void>;
  verifyOtp: () => Promise<boolean>;
  resetAuth: () => void;
  handleLogin: () => Promise<void>;
}
