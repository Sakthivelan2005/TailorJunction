// context/ThemeContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

type UserRole = "tailor" | "customer";
type ThemeType = "tailor" | "customer";

interface ThemeContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  theme: ThemeType;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const TAILOR_THEME = {
  primary: "#EE82EE", // Violet
  secondary: "#DDA0DD",
  background: "#F8F1FA",
  text: "#4A235A",
};

const CUSTOMER_THEME = {
  primary: "#00CED1", // Dark Turquoise
  secondary: "#87CEEB",
  background: "#F0FBFC",
  text: "#0F4C5C",
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userRole, setUserRole] = useState<UserRole>("customer");

  const theme: ThemeType = userRole === "tailor" ? "tailor" : "customer";
  const colors = userRole === "tailor" ? TAILOR_THEME : CUSTOMER_THEME;

  return (
    <ThemeContext.Provider value={{ userRole, setUserRole, theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
