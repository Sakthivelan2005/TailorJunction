// hooks/useToast.ts - FIXED POSITIONING
import { CustomToast } from "@/components/CustomToast";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { View } from "react-native";

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "error";
}

interface ToastContextType {
  showToast: (message: string, type: "success" | "warning" | "error") => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: "success" | "warning" | "error",
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      {/* ✅ ABSOLUTE TOAST OVERLAY */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        {toasts.map((toast, index) => (
          <CustomToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
